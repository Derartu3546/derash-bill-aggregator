export type BillStatus = 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'EXPIRED' | 'CANCELLED';



export class Bill {
  constructor(
    public readonly id: string,
    public readonly billReference: string,
    public readonly customerName: string | null,
    public readonly amount: number,
    public readonly amountPaid: number,
    public readonly dueDate: Date,
    public readonly status: BillStatus,
    public readonly period: string,
    public readonly billerId: string,
    public readonly additionalInfo?: any,
  ) {}
  // Business Rule: How much is left to pay?
  getRemainingAmount(): number {
    return this.amount - this.amountPaid;
  }
}

