import { prisma } from '../database/prisma.ts';
import { ITransactionRepository } from '../../domain/repositories/ITransactionRepository.ts';
import { Transaction, TransactionStatus } from '../../domain/entities/Transaction.ts';

export class PrismaTransactionRepository implements ITransactionRepository {
    private mapToEntity(data: any): Transaction {
        return new Transaction(
            data.id,
            data.transactionId,
            data.agentReference,
            data.derash_ref,
            data.billerReference,
            data.idempotencyKey,
            Number(data.amount),
            Number(data.biller_share),
            Number(data.agent_share),
            Number(data.aggregator_share),
            Number(data.total_amount),
            data.status as TransactionStatus,
            data.payment_method,
            data.agent_id,
            data.bill_id,
            data.createdAt,
            data.updatedAt,
            data.payer_phone,
            data.raw_response
        );
    }

    async findById(id: string): Promise<Transaction | null> {
        const data = await prisma.transaction.findUnique({ where: { id } });
        return data ? this.mapToEntity(data) : null;
    }

    async findByTransactionId(transactionId: string): Promise<Transaction | null> {
        const data = await prisma.transaction.findUnique({ where: { transactionId } });
        return data ? this.mapToEntity(data) : null;
    }

    async findByIdempotencyKey(idempotencyKey: string): Promise<Transaction | null> {
        const data = await prisma.transaction.findUnique({ where: { idempotencyKey } });
        return data ? this.mapToEntity(data) : null;
    }

    async create(data: any, tx?: any): Promise<Transaction> {
        const client = tx || prisma;
        const created = await client.transaction.create({
            data: {
                transactionId: data.transactionId,
                agentReference: data.agentReference,
                idempotencyKey: data.idempotencyKey,
                amount: data.amount,
                biller_share: data.biller_share,
                agent_share: data.agent_share,
                aggregator_share: data.aggregator_share,
                total_amount: data.total_amount,
                status: data.status || 'INITIATED',
                payment_method: data.payment_method,
                payer_phone: data.payer_phone,
                agent_id: data.agent_id,
                bill_id: data.bill_id
            }
        });
        return this.mapToEntity(created);
    }

    async updateStatus(id: string, status: TransactionStatus, extras?: any, tx?: any): Promise<Transaction> {
        const client = tx || prisma;
        const updated = await client.transaction.update({
            where: { id },
            data: {
                status,
                ...extras
            }
        });
        return this.mapToEntity(updated);
    }

    async findByAgent(agent_id: string): Promise<Transaction[]> {
        const data = await prisma.transaction.findMany({
            where: { agent_id },
            orderBy: { createdAt: 'desc' }
        });
        return data.map(this.mapToEntity);
    }
}