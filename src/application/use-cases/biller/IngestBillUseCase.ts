import { IBillRepository } from "../../../domain/repositories/IBillRepository.ts";
import { ICustomerRepository } from "../../../domain/repositories/ICustomerRepository.ts";

export class IngestBillUseCase {
  constructor(
    private billRepo: IBillRepository,
    private customerRepo: ICustomerRepository 
  ) {}

  async execute(bills: any[], biller_id: string, currentUser: any) {
    
    const userBillerId = currentUser.biller_id || currentUser.billerId || currentUser.biller?.id;
    const targetId = String(biller_id || "").trim().toLowerCase();
    const userIdFromToken = String(userBillerId || "").trim().toLowerCase();

    const isSystemAdmin = currentUser.role === 'SUPER_ADMIN';
    const isThisBiller = (currentUser.role === 'BILLER_ADMIN' || currentUser.role === 'BILLER') && 
                         userIdFromToken === targetId;

    if (!isSystemAdmin && !isThisBiller) {
      throw new Error('Unauthorized: You can only upload bills for your own organization');
    }

    const report = { total: bills.length, success: 0, failed: 0, duplicates: 0 };

    
    const defaultCustomer = await this.customerRepo.findFirst();

    for (const billData of bills) {
      try {
       
        const rawAmount = billData.amount_due || billData.amount;
        const amount = typeof rawAmount === 'string' 
          ? parseFloat(rawAmount.replace(/[^0-9.]/g, '')) 
          : parseFloat(rawAmount);

        if (isNaN(amount)) {
          console.warn(`Skipping row: Invalid amount for ref ${billData.bill_reference}`);
          report.failed++;
          continue; 
        }

      
        let dueDate = new Date();
        if (billData.due_date || billData.dueDate) {
          const parsedDate = new Date(billData.due_date || billData.dueDate);
          if (!isNaN(parsedDate.getTime())) {
            dueDate = parsedDate;
          }
        }

        
        const rawPaidAt = billData.paid_at || billData.paidAt || billData.payment_date;
        let paidAt: Date | null = null;
        let billStatus = "UNPAID";

        if (rawPaidAt && rawPaidAt !== "N/A" && String(rawPaidAt).trim() !== "") {
          const parsedPaidDate = new Date(rawPaidAt);
          if (!isNaN(parsedPaidDate.getTime())) {
            paidAt = parsedPaidDate;
            billStatus = "PAID";
          }
        }

        
        let finalCustomerId = billData.customer_id || billData.customerId;
        
        if (!finalCustomerId || finalCustomerId === "null" || finalCustomerId === "CUST-GEN-001") {
          if (!defaultCustomer) {
            throw new Error("No customers found in database. Run seed first.");
          }
          finalCustomerId = defaultCustomer.id;
        }

       
        await this.billRepo.upsert({
          bill_reference: String(billData.bill_reference || "").trim(),
          amount_due: amount,
          remaining_bal: billStatus === "PAID" ? 0 : amount, 
          period: String(billData.period || "N/A").trim(),
          due_date: dueDate,
          biller_id: targetId, 
          customer_id: String(finalCustomerId).trim(),
          status: billStatus, 
          paid_at: paidAt,    
        });

        report.success++;
      } catch (error) {
        console.error(`Upsert Failed for ${billData.bill_reference}:`, error);
        report.failed++;
      }
    }

    return report;
  }
}