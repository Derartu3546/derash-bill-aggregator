import { prisma } from '../database/prisma';
import { IAgentRepository } from '../../domain/repositories/IAgentRepository';
import { Agent } from '../../domain/entities/Agent';

export class PrismaAgentRepository implements IAgentRepository {
    private mapToEntity(data: any): Agent {
        return new Agent(
            data.id,
            data.name,
            data.code,
            data.isEnabled,
            data.createdAt,
        );
    }

    async create(agent: any): Promise<Agent>{
        const created = await prisma.agent.create({ data: agent });
        return this.mapToEntity(created);
    }
    async findByCode(code: string): Promise<Agent | null> {
        const data = await prisma.agent.findUnique({
            where: {
                code
            }
        });
        return data ? this.mapToEntity(data) : null;
    }
    async findById(id: string): Promise<Agent | null> {
        const data = await prisma.agent.findUnique({
            where: {
                id
            }
        });
        return data ? this.mapToEntity(data) : null;
    }

    async findAll(params: { search?: string; page: number; limit: number; }): Promise<Agent[]> {
        const skip = (params.page - 1) * params.limit;
        const where = params.search ? {
            OR: [
                { name: { contains: params.search, mode: 'insensitive' as const } },
                { code: { contains: params.search, mode: 'insensitive' as const } }
            ],
        }
            : {};
        const data = await prisma.agent.findMany({ where, skip, take: params.limit });
        return data.map(this.mapToEntity);
    }

    async update(agent: Agent): Promise<Agent> {
        throw new Error('Not implemented');
    }
    async delete(id: string): Promise<void>{
        throw new Error('Not implemented');
    }
}