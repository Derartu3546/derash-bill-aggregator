export type TransactionStatus = 'INITIATED' | 'SUCCESSFUL' | 'FAILED' | 'EXPIRED' | 'CANCELLED' | 'REVERSED' | 'TIMEOUT';
export type PaymentMethod = 'CASH' | 'MOBILE_APP' | 'BANK_TRANSFER' | 'USSD' | 'CARD' | 'WEB' | 'ATM' | 'WALLET';

export class Transaction {
    constructor(
        public readonly id: string,
        public readonly transactionId: string,
        public readonly agentReference: string | null,
        public readonly derash_ref: string,
        public readonly billerReference: string | null,
        public readonly idempotencyKey: string,
        public readonly amount: number,
        public readonly biller_share: number,
        public readonly agent_share: number,
        public readonly aggregator_share: number,
        public readonly total_amount: number,
        public readonly status: TransactionStatus,
        public readonly payment_method: PaymentMethod,
        public readonly agent_id: string,
        public readonly bill_id: string,
        public readonly createdAt: Date,
        public readonly updatedAt: Date,
        public readonly payer_phone?: string | null,
        public readonly raw_response?: any
    ) {}

   
    isValidSplit(): boolean {
        return (this.biller_share + this.agent_share + this.aggregator_share) === this.amount;
    }
}