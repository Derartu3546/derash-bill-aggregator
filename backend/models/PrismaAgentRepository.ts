import { prisma } from '../config/prisma';
import { IAgentRepository } from './IAgentRepository';
import { Agent } from './Agent';

export class PrismaAgentRepository implements IAgentRepository {
  private mapToEntity(data: any): Agent {
    return new Agent(
      data.id,
      data.name,
      data.code,
      data.apiKey,
      data.isActive,
      data.isEnabled,
      data.isDeleted,
      data.createdAt,
    );
  }

async create(agent: any): Promise<Agent> {
 
  const { id, name, code, apiKey, isEnabled, isDeleted } = agent;

  const created = await prisma.agent.create({ 
    data: {
      name,
      code,
      apiKey,
      isEnabled,
      isDeleted
      
    } 
  });
  
  return this.mapToEntity(created);
}

  async findByCode(code: string): Promise<Agent | null> {
    const data = await prisma.agent.findUnique({
      where: {
        code,
      },
    });
    return data ? this.mapToEntity(data) : null;
  }

  async findById(id: string): Promise<Agent | null> {
    const data = await prisma.agent.findUnique({
      where: {
        id,
      },
    });
    return data ? this.mapToEntity(data) : null;
  }

  async findByApiKey(apiKey: string): Promise<Agent | null> {
    const data = await prisma.agent.findUnique({ 
      where: { apiKey } 
    });
    return data ? this.mapToEntity(data) : null;
  }

  async findAll(params: {
    search?: string;
    page: number;
    limit: number;
  }): Promise<Agent[]> {
    const skip = (params.page - 1) * params.limit;

    // 1. Fetch raw data records
    const records = await prisma.agent.findMany({
      where: {
        isDeleted: false, 
        ...(params.search && {
          OR: [
            { name: { contains: params.search, mode: "insensitive" } },
            { code: { contains: params.search, mode: "insensitive" } },
          ],
        }),
      },
      skip,
      take: params.limit,
    });

    // 🔑 THE FIX: Map the array of raw DB data objects into your Domain Entity instances
    return records.map((record) => this.mapToEntity(record));
  }

  async update(agent: Agent): Promise<Agent> {
    const updated = await prisma.agent.update({
      where: { id: agent.id },
      data: {
        name: agent.name,
        code: agent.code,
        apiKey: agent.apiKey, // 💡 Added to make sure apiKey isn't lost or mismatched on updates
        isEnabled: agent.isEnabled,
        isDeleted: agent.isDeleted
      },
    });
    return this.mapToEntity(updated);
  }

  async delete(id: string): Promise<void> {
    await prisma.agent.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });
  }
}