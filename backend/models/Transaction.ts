export type TransactionStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REVERSED';

export class Transaction {
    constructor(
        public readonly id: string,
        public readonly transactionId: string,
        public readonly amount: number,
        public readonly fee: number,
        public readonly totalAmount: number,
        public readonly status: TransactionStatus,
        public readonly idempotencyKey: string,
        public readonly billId: string,
        public readonly agentId: string,
        public readonly createdAt?: Date
    )
    {}
}