import { BillStatus } from '@prisma/client';

export class BillingEngine {
  static DAILY_PENALTY = 5.00;
  static MAX_PENALTY_DAYS = 15;

  static calculate(bill: any) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(bill.due_date);
    const remainingDebt = Number(bill.remaining_bal);
    const graceDays = bill.biller.grace_period || 0;
    let daysLate = 0;
    let penaltyFee = 0;
    const graceDaysRemaining = Math.max(0, graceDays- daysLate +1 ); // +1 to include the due date as part of the grace period

     const diffTime = today.getTime() - dueDate.getTime();
     daysLate = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    // 1. Determine "Virtual" Status
    let effectiveStatus = bill.status;
    if (daysLate > graceDays && bill.status !== BillStatus.PAID) {
      effectiveStatus = BillStatus.EXPIRED;
    }

    // 2. Penalty Logic (capped at 15 days)
  
    if (daysLate > graceDays && remainingDebt > 0) {

      if(!bill.biller.charges_late_fee) {
         throw new Error(`Payment Blocked: Service disconnected. Grace period of ${graceDays} days has passed.
          please contact the service provider to restore the service.`);
      }
      


      
      // Rule: Payment Blocked after 15 days
      if (daysLate > this.MAX_PENALTY_DAYS) {
        throw new Error(`Payment Blocked: Bill is ${daysLate} days late (Max allowed: ${this.MAX_PENALTY_DAYS}).`);
      }
      penaltyFee = daysLate * this.DAILY_PENALTY;
    }

    return {
      effectiveStatus,
      daysLate,
      penaltyFee,
      totalRequired: remainingDebt + penaltyFee,
      remainingDebt,
      isWithinGracePeriod: daysLate > 0 && daysLate <= graceDays,
      graceDaysRemaining
    };
  }
}