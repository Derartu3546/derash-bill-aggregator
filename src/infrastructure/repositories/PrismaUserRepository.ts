import { prisma } from '../database/prisma';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { User, UserRole } from '../../domain/entities/User';


export class PrismaUserRepository implements IUserRepository {
  async create(user: any): Promise<User> {
    const created = await prisma.user.create({
      data: {
        email: user.email,
        passwordHash: user.passwordHash,
        fullName: user.fullName,
        role: user.role,
        billerId: user.billerId,
        agentId: user.agentId,
      },
    });

    return new User(
      created.id,
      created.email,
      created.role as UserRole,
      created.fullName,
      created.billerId || "",
      created.agentId || "",
    );
  }
  async findByEmail(email: string): Promise<User | null> {
    const data = await prisma.user.findUnique({ where: { email } });
    if (!data) return null;
    return new User(
      data.id,
      data.email,
      data.role as UserRole,
      data.fullName,
      data.billerId || "",
      data.agentId || "",
    );
  }
  async findById(id: string) {
    return null;
  }
  async update(user: any) {
    return user;
  }
  async delete(id: string) {}
  async findByAgentId(id: string) {
    return [];
  }
  async findByBillerId(id: string) {
    return [];
  }
  async getHashByEmail(email: string): Promise<string | null> {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { passwordHash: true }
    });
    return user?.passwordHash || null;
  }
}