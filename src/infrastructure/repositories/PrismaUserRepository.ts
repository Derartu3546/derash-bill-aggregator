import { prisma } from '../database/prisma.ts';
import { IUserRepository } from '../../domain/repositories/IUserRepository.ts';
import { User, UserRole } from '../../domain/entities/User.ts';

export class PrismaUserRepository implements IUserRepository {
  private mapToEntity(data: any): User {
    return new User(
      data.id,
      data.email,
      data.role as UserRole,
      data.password, 
      data.name,
      true, 
      data.biller_id || undefined,
      data.agent_id || undefined,
      data.agent ? {
        code: data.agent.code,
        api_key: data.agent.api_key ?? "",
        name: data.agent.name
      } : undefined,
      data.biller ? {
        id: data.biller.id,
        name: data.biller.name
      } : undefined
    );
  }

  async create(user: any): Promise<User> {
    const created = await prisma.user.create({
      data: {
        email: user.email,
        password: user.password, 
        name: user.name,
        role: user.role as any, 
        biller_id: user.biller_id, 
        agent_id: user.agent_id,   
      },
      include: {
        agent: true,
        biller: true
      }
    });

    return this.mapToEntity(created);
  }

  async findByEmail(email: string): Promise<User | null> {
    const data = await prisma.user.findUnique({ 
      where: { email },
      include: {
        agent: true,
        biller: true
      }
    });

    if (!data) return null;
    return this.mapToEntity(data);
  }

  async getHashByEmail(email: string): Promise<string | null> {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { password: true }
    });
    return user?.password || null;
  }

  async findById(id: string): Promise<User | null> {
    const data = await prisma.user.findUnique({ 
        where: { id },
        include: { agent: true, biller: true } 
    });
    
    if (!data) return null;
    return this.mapToEntity(data);
  }

  async update(user: any): Promise<User> {
    const updated = await prisma.user.update({
        where: { id: user.id },
        data: { 
            name: user.name, 
            email: user.email,
            // Only update password if explicitly provided and hashed
            ...(user.password && { password: user.password }) 
        },
        include: { agent: true, biller: true }
    });
    return this.mapToEntity(updated);
  }

  async delete(id: string): Promise<void> {
    await prisma.user.delete({ where: { id } });
  }

  async findByAgentId(agentId: string): Promise<User[]> {
    const users = await prisma.user.findMany({ 
        where: { agent_id: agentId },
        include: { agent: true, biller: true }
    });
    return users.map(u => this.mapToEntity(u));
  }

  async findByBillerId(billerId: string): Promise<User[]> {
    const users = await prisma.user.findMany({ 
        where: { biller_id: billerId },
        include: { agent: true, biller: true }
    });
    return users.map(u => this.mapToEntity(u));
  }
}