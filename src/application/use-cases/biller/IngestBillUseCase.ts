import { success } from "zod";
import { IBillRepository } from "../../../domain/repositories/IBillRepository";

export class IngestBillUseCase {
  constructor(private billRepo: IBillRepository) {}

  async execute(bills: any[], billerId: string, currentUser: any) {
    const isSystemAdmin = currentUser.role === 'SYSTEM_ADMIN';
    const isThisBiller = currentUser.role === 'BILLER_USER' && currentUser.billerId === billerId;

    if (!isSystemAdmin && !isThisBiller) {
      throw new Error('Unauthorozed: You can only upload bills for your own organization');
    }
    const report = {
      total: bills.length,
      success: 0,
      failed: 0,
      duplicates: 0,
    };

    for (const billData of bills) {
      try {
        if (!billData.billReference || !billData.period) {
          throw new Error("Missing required fields: billReference or period");
        }

        const existingBill = await this.billRepo.findDuplicate(
          billData.billReference,
          billData.period,
          billerId,
        );
        if (existingBill) {
          report.duplicates++;
          continue;
        }

        await this.billRepo.create({
          ...billData,
          billerId,
          status: "UNPAID",
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

    return report;
  }
}

