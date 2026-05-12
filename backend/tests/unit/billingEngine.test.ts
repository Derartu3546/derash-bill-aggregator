import { BillingEngine } from "../../services/BillingEngine";



describe("BillingEngine Unit Tests", () => {
    it("should allow payment when amount equals total required", () => {
        const mockBill = {
          amount: 1000,
          remainingBalance: 1000,
          dueDate: new Date(Date.now() + 86400000), // Due tomorrow
          biller: { gracePeriod: 0, chargesLateFee: false },
        };
        const result = BillingEngine.calculate(mockBill);
        expect(result.totalRequired).toBe(1000);
        expect(result.isBlocked).toBe(false);
    });
  const mockBill = {
    amount: 500,
    remainingBalance: 500,
    dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    biller: {
      gracePeriod: 2,
      chargesLateFee: true,
    },
  };
  it("should calculate penalty correctly after grace period", () => {
    const result = BillingEngine.calculate(mockBill);
    expect(result.penaltyFee).toBeGreaterThan(0);
    expect(result.totalRequired).toBe(500 + result.penaltyFee);
  });
  it("should block payment if the engine marks it as blocked", () => {
    const blockedBill = { ...mockBill, status: "BLOCKED" };
    const result = BillingEngine.calculate(blockedBill);
    expect(result.isBlocked).toBe(true);
  });
    it("should calculate penalty fees correctly for late bills", () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 10); // 10 days overdue

      const mockBill = {
        amount: 1000,
        remainingBalance: 1000,
        dueDate: pastDate,
        biller: { gracePeriod: 2, chargesLateFee: true },
      };

      const result = BillingEngine.calculate(mockBill);
      expect(result.penaltyFee).toBeGreaterThan(0);
      expect(result.isWithinGracePeriod).toBe(false);
    });
});