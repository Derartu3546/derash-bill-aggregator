import { Transaction, TransactionStatus } from '../entities/Transaction.ts';

export interface ITransactionRepository {
    findById(id: string): Promise<Transaction | null>;
    findByTransactionId(transactionId: string): Promise<Transaction | null>;
    findByIdempotencyKey(key: string): Promise<Transaction | null>;
    create(data:{
        transactionId: string;
        idempotencyKey: string;
        amount: number;
        total_amount: number;
        status: string;
        payment_method: string;
        agent_id: string;
        bill_id: string;
        payer_phone?: string;
        agent_share: number;
        aggregator_share: number;
        biller_share: number;
        raw_response?: any;
    }, tx?: any): Promise<Transaction>;
    
   
    updateStatus(id: string, status: TransactionStatus, extras?: { 
        billerReference?: string, 
        amount?: number,
        biller_share?: number,
        agent_share?: number,
        aggregator_share?: number,
        total_amount?: number,
        raw_response?: any 
    }, tx?: any): Promise<Transaction>;

  
    findByAgent(agentId: string): Promise<Transaction[]>;
}

