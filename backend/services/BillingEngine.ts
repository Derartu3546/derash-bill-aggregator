import { BillStatus } from "@prisma/client";

export class BillingEngine {
  static DAILY_PENALTY = 5.0;
  static MAX_PENALTY_DAYS = 15;

  static calculate(bill: any) {
    if (!bill) {
      throw new Error(
        "No billing data provided to the calculations engine."
      );
    }

    if (bill.status === "BLOCKED") {
      return {
        effectiveStatus: "BLOCKED",
        daysLate: 0,
        penaltyFee: 0,
        totalRequired: Number(bill.remainingBalance || 0),
        remainingDebt: Number(bill.remainingBalance || 0),
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
    dueDate.setHours(0, 0, 0, 0);

    // FIX: derive debt from amount if remainingBalance is zero
    const remainingDebt =
      Number(bill.remainingBalance) > 0
        ? Number(bill.remainingBalance)
        : Number(bill.amount) - Number(bill.amountPaid || 0);

    const graceDays = Number(bill.biller?.gracePeriod ?? 0);

    const diffTime = today.getTime() - dueDate.getTime();
    const msInDay = 1000 * 60 * 60 * 24;

    let daysLate = Math.floor(diffTime / msInDay);

    if (daysLate < 0) {
      daysLate = 0;
    }

    let penaltyFee = 0;
    let isBlocked = false;
    let blockReason = "";

    if (daysLate > 0 && remainingDebt > 0) {
      if (daysLate > graceDays) {
        if (!bill.biller?.chargesLateFee) {
          isBlocked = true;
          blockReason = `Service disconnected. Grace period of ${graceDays} days passed. Please contact provider.`;
        } else if (
          daysLate >
          graceDays + this.MAX_PENALTY_DAYS
        ) {
          isBlocked = true;
          blockReason = `Payment Blocked: Bill is ${daysLate} days late (Max: ${this.MAX_PENALTY_DAYS}).`;
        } else {
          penaltyFee =
            (daysLate - graceDays) * this.DAILY_PENALTY;
        }
      }
    }

    const totalRequired = remainingDebt + penaltyFee;

    // FIX: only expire after exceeding grace period + max penalty days
    const hasExpired =
      remainingDebt > 0 &&
      daysLate >
        graceDays + this.MAX_PENALTY_DAYS;

    return {
      effectiveStatus: hasExpired
        ? BillStatus.EXPIRED
        : bill.status || BillStatus.UNPAID,

      daysLate,
      penaltyFee,
      totalRequired,
      remainingDebt,

      isWithinGracePeriod:
        daysLate > 0 && daysLate <= graceDays,

      graceDaysRemaining:
        daysLate <= graceDays
          ? Math.max(0, graceDays - daysLate)
          : 0,

      isBlocked,
      blockReason,
    };
  }
}