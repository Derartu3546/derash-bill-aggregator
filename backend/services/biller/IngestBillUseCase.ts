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
      currentUser.role === "BILLER_USER" &&
      currentUser.billerId === billerId;

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

    // Get all bill references
    const billRefs = bills.map((b) => b.billReference);

    // Fetch existing bills once
    const existingBills = await prisma.bill.findMany({
      where: {
        billerId,
        billReference: {
          in: billRefs,
        },
      },
      select: {
        billReference: true,
        period: true,
      },
    });

    const existingSet = new Set(
      existingBills.map(
        (b) => `${b.billReference}-${b.period}`,
      ),
    );

    const seen = new Set<string>();
    const toInsert: any[] = [];

    for (const billData of bills) {
      const finalPeriod = billData.period || fallbacks?.period;
      const finalDueDate = billData.dueDate || fallbacks?.dueDate;

      if (!finalPeriod || !finalDueDate) {
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
        billData.amount <= 0
      ) {
        report.failed++;
        continue;
      }

      const key = `${billData.billReference}-${finalPeriod}`;

      if (seen.has(key) || existingSet.has(key)) {
        report.duplicates++;
        continue;
      }

      seen.add(key);

      toInsert.push({
        billReference: billData.billReference,
        customerName: billData.customerName,
        amount: billData.amount,

        // FIXED
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

      report.success = result.count;
    }

    report.failed =
      report.total -
      report.success -
      report.duplicates;

    if (report.success > 0) {
      try {
        await NotificationService.sendToAdmins(
          "New Bills Ingested",
          `Biller ${billerId} uploaded ${report.success} new bills successfully.`,
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