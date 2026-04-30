import { IBillRepository } from "../../../domain/repositories/IBillRepository";
import { prisma } from '../../../infrastructure/database/prisma';

interface IngestionFallbacks {
  period?: string;
  dueDate?: string | Date
}

export class IngestBillUseCase {
  constructor(private billRepo: IBillRepository) {}

  async execute(bills: any[], billerId: string, currentUser: any, fallbacks?: IngestionFallbacks) {
    const isSystemAdmin = currentUser.role === 'SYSTEM_ADMIN';
    const isThisBiller = currentUser.role === 'BILLER_USER' && currentUser.billerId === billerId;

    if (!isSystemAdmin && !isThisBiller) {
      throw new Error('Unauthorized: You can only upload bills for your own organization');
    }
    const report = {
      total: bills.length,
      success: 0,
      failed: 0,
      duplicates: 0,
    };
    await prisma.$transaction(async (tx) => {
   for (const billData of bills) {
     try {
       const finalPeriod = billData.period || fallbacks?.period;
       const finalDueDate = billData.dueDate || fallbacks?.dueDate;

       if (!finalPeriod || !finalDueDate) {
         console.error(
           `Missing required fields for ref: ${billData.billReference}`,
         );
         report.failed++;
         continue;
       }
       const existingBill = await this.billRepo.findDuplicate(
         billData.billReference,
         finalPeriod,
         billerId,
       );
       if (existingBill) {
         report.duplicates++;
         continue;
       }

       await this.billRepo.create({
         billReference: billData.billReference,
         customerName: billData.customerName,
         amount: billData.amount,
         period: finalPeriod,
         dueDate: new Date(finalDueDate),
         billerId: billerId,
         status: "UNPAID",
         currency: "ETB",
       });
       report.success++;
     } catch (error: any) {
       console.log("PRISMA ERROR CODE:", error.code);
       if (
         error.code === "P2002" ||
         error.message?.includes("Unique constraint failed")
       ) {
         report.duplicates++;
       } else {
         console.error(
           "INGESTION FAILED FOR:",
           billData.billReference,
           error.message,
         );
         report.failed++;
       }
     }
   }
 })
    

    return report;
  }
}

