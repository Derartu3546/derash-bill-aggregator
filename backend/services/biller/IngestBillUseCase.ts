import { IBillRepository } from "../../models/IBillRepository";
import { prisma } from "../../config/prisma";
import { NotificationService } from "../../shared/NotificationService";
import { BillStatus } from "@prisma/client";

interface IngestionFallbacks {
  period?: string;
  dueDate?: string | Date;
}

export class IngestBillUseCase {
  constructor(private billRepo: IBillRepository) {}

  async execute(
    bills: any[],
    billerId: string,
    currentUser: any,
    fallbacks?: IngestionFallbacks,
  ) {
    const isSystemAdmin = currentUser.role === "SYSTEM_ADMIN";

    const isThisBiller =
      currentUser.role === "BILLER_USER" && currentUser.billerId === billerId;

    if (!isSystemAdmin && !isThisBiller) {
      throw new Error(
        "Unauthorized: You can only upload bills for your own organization",
      );
    }

    const report = {
      total: bills.length,
      success: 0,
      failed: 0,
      duplicates: 0,
    };

    const billRefs = bills.map((b) => b.billReference);

    // Fetch existing bills, including soft-deleted bills.
    const existingBills = await prisma.bill.findMany({
      where: {
        billerId,
        billReference: {
          in: billRefs,
        },
      },
      select: {
        id: true,
        billReference: true,
        period: true,
        isDeleted: true,
      },
    });

    const activeSet = new Set<string>();
    const deletedMap = new Map<
      string,
      { id: string; billReference: string; period: string }
    >();

    for (const bill of existingBills) {
      const key = `${bill.billReference}-${bill.period}`;

      if (bill.isDeleted) {
        deletedMap.set(key, {
          id: bill.id,
          billReference: bill.billReference,
          period: bill.period,
        });
      } else {
        activeSet.add(key);
      }
    }

    const seen = new Set<string>();
    const toInsert: any[] = [];

    for (const billData of bills) {
      const finalPeriod = billData.period || fallbacks?.period;
      const finalDueDate = billData.dueDate || fallbacks?.dueDate;

      if (!finalPeriod || !finalDueDate || !billData.billReference) {
        report.failed++;
        continue;
      }

      const parsedDate = new Date(finalDueDate);

      if (isNaN(parsedDate.getTime())) {
        report.failed++;
        continue;
      }

      if (
        typeof billData.amount !== "number" ||
        !Number.isFinite(billData.amount) ||
        billData.amount <= 0
      ) {
        report.failed++;
        continue;
      }

      const key = `${billData.billReference}-${finalPeriod}`;

      // Skip repeated entries in the same uploaded file.
      if (seen.has(key)) {
        report.duplicates++;
        continue;
      }

      seen.add(key);

      // Skip a matching bill that is already active.
      if (activeSet.has(key)) {
        report.duplicates++;
        continue;
      }

      // Restore a matching soft-deleted bill instead of creating a new row.
      const deletedBill = deletedMap.get(key);

      if (deletedBill) {
        await prisma.bill.update({
          where: {
            id: deletedBill.id,
          },
          data: {
            isDeleted: false,
            deletedAt: null,
          },
        });

        report.success++;
        continue;
      }

      // Insert a genuinely new bill.
      toInsert.push({
        billReference: billData.billReference,
        customerName: billData.customerName,
        amount: billData.amount,
        amountPaid: 0,
        remainingBalance: billData.amount,
        period: finalPeriod,
        dueDate: parsedDate,
        billerId,
        status: BillStatus.UNPAID,
        currency: "ETB",
      });
    }

    if (toInsert.length > 0) {
      const result = await prisma.bill.createMany({
        data: toInsert,
        skipDuplicates: true,
      });

      report.success += result.count;
    }

    report.failed = report.total - report.success - report.duplicates;

    if (report.success > 0) {
      try {
        await NotificationService.sendToAdmins(
          "New Bills Ingested",
          `Biller ${billerId} uploaded or restored ${report.success} bills successfully.`,
          "BILL_UPLOADED",
        );
      } catch (notifyError) {
        console.error(
          "Notification failed to send, but bills were saved:",
          notifyError,
        );
      }
    }

    return report;
  }
}
