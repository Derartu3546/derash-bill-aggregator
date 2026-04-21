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
    const report = { total: bills.length, success: 0, failed: 0 };

    for (const billData of bills) {
      try {
        await this.billRepo.upsert({
          ...billData,
          billerId,
          status: "UNPAID",
        });
        report.success++;
      } catch (error) {
        console.error(error);
        report.failed++;
      }
    }

    return report;
  }
}

