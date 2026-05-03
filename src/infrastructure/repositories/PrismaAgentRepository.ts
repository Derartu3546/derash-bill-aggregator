import { prisma } from '../database/prisma.ts';
import { IAgentRepository } from '../../domain/repositories/IAgentRepository.ts';
import { Agent } from '../../domain/entities/Agent.ts';

export class PrismaAgentRepository implements IAgentRepository {
  
  private mapToEntity(data: any): Agent {
    return new Agent(
      data.id,
      data.name,
      data.code,
      data.api_key,
      data.isActive,
      data.createdAt,
      data.updatedAt
    );
  }

  async findById(id: string): Promise<Agent | null> {
    const data = await prisma.agent.findUnique({ 
      where: { id } 
    });
    return data ? this.mapToEntity(data) : null;
  }

  async findByCode(code: string): Promise<Agent | null> {
    const data = await prisma.agent.findUnique({ 
      where: { code } 
    });
    return data ? this.mapToEntity(data) : null;
  }

  async findByApiKey(api_key: string): Promise<Agent | null> {
    const data = await prisma.agent.findUnique({ 
      where: { api_key } 
    });
    return data ? this.mapToEntity(data) : null;
  }

  async create(agentData: any): Promise<Agent> {
    const created = await prisma.agent.create({
      data: {
        id: agentData.id,
        name: agentData.name,
        code: agentData.code,
        api_key: agentData.api_key,
        isActive: agentData.isActive ?? true,
      }
    });
    return this.mapToEntity(created);
  }

  async updateStatus(id: string, isActive: boolean, tx?: any): Promise<Agent> {
    const client = tx || prisma;
    const updated = await client.agent.update({
      where: { id },
      data: { isActive }
    });
    return this.mapToEntity(updated);
  }

  async findAllActive(): Promise<Agent[]> {
    const data = await prisma.agent.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    });
    return data.map(this.mapToEntity);
  }

  async count(): Promise<number> {
    return await prisma.agent.count();
  }
}