import { prisma } from '../config/prisma';
import { IAgentRepository } from './IAgentRepository';
import { Agent } from './Agent';

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

  async create(agent: any): Promise<Agent> {
    const created = await prisma.agent.create({ data: agent });
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

  async findAll(params: {
    search?: string;
    page: number;
    limit: number;
  }): Promise<Agent[]> {
    const skip = (params.page - 1) * params.limit;

    return await prisma.agent.findMany({
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
  }

  async update(agent: Agent): Promise<Agent> {
    const updated = await prisma.agent.update({
      where: { id: agent.id },
      data: {
        name: agent.name,
        code: agent.code,
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
