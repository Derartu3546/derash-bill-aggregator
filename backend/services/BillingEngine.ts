import { BillStatus } from '@prisma/client';

export class BillingEngine {
  static DAILY_PENALTY = 5.00;
  static MAX_PENALTY_DAYS = 15;

  static calculate(bill: any) {
    if (bill.status === "BLOCKED") {
      return {
        effectiveStatus: "BLOCKED",
        daysLate: 0,
        penaltyFee: 0,
        totalRequired: Number(bill.remainingBalance),
        remainingDebt: Number(bill.remainingBalance),
        isWithinGracePeriod: false,
        graceDaysRemaining: 0,
        isBlocked: true,
        blockReason:
          "This bill has been manually blocked by the administrator.",
      };
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(bill.dueDate);
    const remainingDebt = Number(bill.remainingBalance);
    const graceDays = bill.biller.gracePeriod || 0;
    
    const diffTime = today.getTime() - dueDate.getTime();
    const daysLate = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));

    let penaltyFee = 0;
    let isBlocked = false;
    let blockReason = "";

    if (daysLate > graceDays && remainingDebt > 0) {
      if (!bill.biller.chargesLateFee) {
        isBlocked = true;
        blockReason = `Service disconnected. Grace period of ${graceDays} days passed. Please contact provider.`;
      } else if (daysLate > this.MAX_PENALTY_DAYS) {
        // Max Delay Case
        isBlocked = true;
        blockReason = `Payment Blocked: Bill is ${daysLate} days late (Max: ${this.MAX_PENALTY_DAYS}).`;
      } else {
        penaltyFee = daysLate * this.DAILY_PENALTY;
      }
    }

    const totalRequired = remainingDebt + penaltyFee;

    return {
      effectiveStatus: daysLate > graceDays ? BillStatus.EXPIRED : bill.status,
      daysLate,
      penaltyFee,
      totalRequired,
      remainingDebt,
      isWithinGracePeriod: daysLate > 0 && daysLate <= graceDays,
      graceDaysRemaining: Math.max(0, graceDays - daysLate),
      isBlocked,
      blockReason
    };
  }
}