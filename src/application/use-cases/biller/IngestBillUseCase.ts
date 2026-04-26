import { success } from "zod";
import { IBillRepository } from "../../../domain/repositories/IBillRepository.ts";

export class IngestBillUseCase {
  constructor(private billRepo: IBillRepository) {}

  async execute(bills: any[], biller_id: string, currentUser: any) {
    const isSystemAdmin = currentUser.role === 'SUPER_ADMIN';
    const isThisBiller = (currentUser.role === 'BILLER_ADMIN' || currentUser.role === 'BILLER') && currentUser.biller_id === biller_id;

    if (!isSystemAdmin && !isThisBiller) {
      throw new Error('Unauthorized: You can only upload bills for your own organization');
    }

    const report = { total: bills.length, success: 0, failed: 0 };

    for (const billData of bills) {
      try {
        await this.billRepo.upsert({
          bill_reference: billData.bill_reference,
          // Map CSV 'amount' to DB 'amount_due'
          amount_due: billData.amount_due,
          remaining_bal: billData.amount_due, 
          period: billData.period,
          due_date: billData.due_date || new Date(), // Fallback if missing
          biller_id: biller_id,
          customer_id: billData.customer_id || "DEFAULT_CUST_ID", // Ensure this exists
          status: "UNPAID",
        });
        report.success++;
      } catch (error) {
        console.error("Upsert Failed for Reference:", billData.bill_reference, error);
        report.failed++;
      }
    }

    return report;
  }
}