import { Transaction, TransactionStatus } from "../entities/Transaction";

export interface ITransactionRepository {
    findById(id: string): Promise<Transaction | null>;
    findByTransactionId(transactionId: string): Promise<Transaction | null>;
    findByAgentReference(agentReference: string): Promise<Transaction | null>;
    findByIdempotencyKey(key: string): Promise<Transaction | null>;
    create(transaction: Transaction): Promise<Transaction>;
    updateStatus(id: string, status: TransactionStatus, error?: string): Promise<Transaction>;
    // For Auditing purposes
    findByBillId(billId: string): Promise<Transaction[]>;
}


