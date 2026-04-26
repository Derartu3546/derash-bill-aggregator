export type BillStatus = 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'EXPIRED' | 'CANCELLED';

export class Bill {
    constructor(
        public readonly id: string,
        public readonly bill_reference: string,
        public readonly amount_due: number,      // Matches schema field name
        public readonly amount_paid: number,
        public readonly remaining_bal: number,   // Added from schema
        public readonly currency: string,        // Added (Default "ETB")
        public readonly status: BillStatus,
        public readonly due_date: Date,          // Added (Important for penalties)
        public readonly paid_at: Date | null,    // Added
        public readonly period: string,
        public readonly biller_id: string,
        public readonly customer_id: string,     // Added (Links to the Customer)
        public readonly createdAt?: Date,
        public readonly updatedAt?: Date
    ) { }

    isOverdue(): boolean {
        return new Date() > this.due_date && this.status !== 'PAID';
    }


    canBePaid(): boolean {
        return this.status === 'UNPAID' || this.status === 'PARTIALLY_PAID';
    }

    /**
     * Business Rule: Calculation for display purposes
     */
    getFormattedRemaining(): string {
        return `${this.remaining_bal} ${this.currency}`;
    }
}