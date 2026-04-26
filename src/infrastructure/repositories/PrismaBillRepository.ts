import { prisma } from "../database/prisma.ts";
import { BillWithRelations, IBillRepository } from "../../domain/repositories/IBillRepository.ts";
import { Bill, BillStatus } from "../../domain/entities/Bill.ts";

export class PrismaBillRepository implements IBillRepository {
 
  private mapToEntity(data: any): Bill {
    return new Bill(
      data.id,
      data.bill_reference,
      Number(data.amount_due),
      Number(data.amount_paid),
      Number(data.remaining_bal),
      data.currency,
      data.status as BillStatus,
      data.due_date,
      data.paid_at,
      data.period,
      data.biller_id,
      data.customer_id,
      data.createdAt,
      data.updatedAt
    );
  }

  async findById(id: string): Promise<Bill | null> {
    const b = await prisma.bill.findUnique({
      where: { id },
    });
    
    // Updated: Use mapToEntity to keep logic consistent
    return b ? this.mapToEntity(b) : null;
  }

  async findByReference(
    biller_id: string,
    bill_reference: string,
    period: string,
  ): Promise<BillWithRelations | null> {
    const data = await prisma.bill.findFirst({
      where: { bill_reference},
      include: {
        biller: true,
        customer: true,
      }
    });
    if (!data) return null;

  // FIX: You must attach the relations to the entity
  const billEntity = this.mapToEntity(data);
  return Object.assign(billEntity, {
      biller: data.biller,
      customer: data.customer
  }) as unknown as BillWithRelations;
  }

  async findActiveBillsForAgent(bill_reference: string): Promise<Bill[]> {
    const bills = await prisma.bill.findMany({
      where: {
        bill_reference,
        status: "UNPAID",
      },
    });

    return bills.map((b) => this.mapToEntity(b));
  }

  async findByIdWithLock(
    id: string, 
    tx: any): 
    Promise<BillWithRelations | null> {
    // 1. Lock the row using raw SQL
    await tx.$executeRaw`SELECT id FROM "Bill" WHERE id = ${id} FOR UPDATE`;

    // 2. Fetch the full data including relations using the transaction client
    const data = await tx.bill.findUnique({
        where: { id },
        include: { 
            biller: true, 
            customer: true 
        }
    });

    if (!data) return null;

    // 3. Construct the BillWithRelations object
    const billEntity = this.mapToEntity(data);
    
    // We manually attach the relations to satisfy the type
    return Object.assign(billEntity, {
        biller: data.biller,   // This assumes your Biller entity matches the DB
        customer: data.customer
    }) as unknown as BillWithRelations;
}
  async updateStatus(
    id: string,
    tx: any,
    status: BillStatus,
    amount_paid?: number,
  ): Promise<Bill> {
    const updated = await tx.bill.update({
      where: { id },
      data: {
        status,
        amount_paid,
        // Automatically calculate remaining balance if amount_paid is updated
        // remaining_bal: amount_due - amount_paid (Logic depends on your schema defaults)
      },
    });

    return this.mapToEntity(updated);
  }

  async upsert(data: any): Promise<void> {
    await prisma.bill.upsert({
      where: {
        bill_reference: data.bill_reference,
      },
      update: {
        amount_due: data.amount_due,
        remaining_bal: data.remaining_bal,
        status: data.status,
      },
      create: {
        id: data.id,
        bill_reference: data.bill_reference,
        amount_due: data.amount_due,
        amount_paid: data.amount_paid || 0,
        remaining_bal: data.remaining_bal,
        status: data.status,
        // Fixed: Ensure dates are handled even if they come in as strings
        due_date: new Date(data.due_date),
        paid_at: data.paid_at ? new Date(data.paid_at) : new Date(), 
        period: data.period,
        biller_id: data.biller_id,
        customer_id: data.customer_id,
      },
    });
  }
}