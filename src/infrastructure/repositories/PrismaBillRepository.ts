import { prisma } from "../database/prisma";
import { IBillRepository } from "../../domain/repositories/IBillRepository";
import { Bill, BillStatus } from "../../domain/entities/Bill";
import { count } from "node:console";

export class PrismaBillRepository implements IBillRepository {
  private mapToEntity(data: any): Bill {
    return new Bill(
      data.id,
      data.billReference,
      data.customerName,
      Number(data.amount),
      Number(data.amountPaid),
      data.status as BillStatus,
      data.period,
      data.billerId,
      data.additionalInfo,
    );
  }

  async findById(id: string): Promise<Bill | null> {
    const b = await prisma.bill.findUnique({
      where: { id },
    });
    if (!b) return null;
    return new Bill(
      b.id,
      b.billReference,
      b.customerName,
      Number(b.amount),
      Number(b.amountPaid),
      b.status as BillStatus,
      b.period,
      b.billerId,
    );
  }

  async findByReference(
    billerId: string,
    billReference: string,
    period: string,
  ): Promise<Bill | null> {
    const bill = await prisma.bill.findFirst({
      where: {
        billerId,
        billReference,
        period,
      },
    });

    return bill ? this.mapToEntity(bill) : null;
  }

  async findActiveBillsForAgent(billReference: string): Promise<Bill[]> {
    const bills = await prisma.bill.findMany({
      where: {
        billReference,
        status: "UNPAID",
      },
    });

    return bills.map((b) => this.mapToEntity(b));
  }

  async findByIdWithLock(id: string, tx: any): Promise<Bill | null> {
    const [bill]: any = await tx.$queryRaw`
        SELECT * FROM "Bill"
        WHERE id = ${id}
        FOR UPDATE
      `;

    return bill ? this.mapToEntity(bill) : null;
  }

  async updateStatus(
    id: string,
    tx: any,
    status: BillStatus,
    amountPaid?: number,
  ): Promise<Bill> {
    const updated = await tx.bill.update({
      where: { id },
      data: {
        status,
        amountPaid,
      },
    });

    return this.mapToEntity(updated);
  }

  async upsert(data: any): Promise<void> {
    await prisma.bill.upsert({
      where: {
        billReference_period_billerId: {
          billReference: data.billReference,
          period: data.period,
          billerId: data.billerId,
        },
      },

      update: {
        amount: data.amount,
        customerName: data.customerName,
        status: data.status,
        phoneNumber: data.phoneNumber,
      },

      create: {
        id: data.id,
        billReference: data.billReference,
        customerName: data.customerName,
        amount: data.amount,
        amountPaid: data.amountPaid,
        status: data.status,
        period: data.period,
        billerId: data.billerId,
        additionalInfo: data.additionalInfo,
      },
    });
  }

  async getBillerStats(billerId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [counts, revenueData, monthlyRevenueData] = await Promise.all([
      prisma.bill.groupBy({
        by: ["status"],
        where: { billerId },
        _count: true,
      }),

      prisma.bill.aggregate({
        where: { billerId },
        _sum: { amountPaid: true, amount: true },
      }),

      prisma.bill.aggregate({
        where: {
          billerId,
          createdAt: { gte: startOfMonth },
        },
        _sum: { amountPaid: true },
      }),
    ]);

    return { counts, revenueData, monthlyRevenueData };
  }

  async findByBillerId(billerId: string) {
    return await prisma.bill.findMany({
      where: { billerId: billerId },
      orderBy: { createdAt: "desc" },
      include: {
        transactions: true,
      },
    });
  }

  async findReportData(billerId: string, fromDate?: string, toDate?: string) {
    return await prisma.bill.findMany({
      where: {
        billerId: billerId,
        createdAt: {
          ...(fromDate && { gte: new Date(fromDate) }),
          ...(toDate && { lte: new Date(toDate) }),
        },
      },
      include: {
        transactions: true, // plural, matches Prisma model
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.bill.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });
  }
  async findMany(filters: any) {
    return await prisma.bill.findMany({
      where: {
        ...filters,
        isDeleted: false
      }
    })
  }
}
