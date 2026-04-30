import { prisma } from "../database/prisma";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { User, UserRole } from "../../domain/entities/User";
import { RefreshToken } from "@prisma/client";

export class PrismaUserRepository implements IUserRepository {
  private toDomain(u: any): User {
    return new User(
      u.id,
      u.email,
      u.role as UserRole,
      u.fullName,
      u.status,
      u.passwordHash,
      u.isDeleted,
      u.billerId || "",
      u.agentId || "",
    );
  }

  // Create a new user
  async create(user: any): Promise<User> {
    const created = await prisma.user.create({
      data: {
        email: user.email,
        passwordHash: user.passwordHash,
        fullName: user.fullName,
        role: user.role,
        status: user.status || "active",
        billerId: user.billerId,
        agentId: user.agentId,
        mustChangePassword: user.mustChangePassword,
      },
    });

    return this.toDomain(created);
  }

  // Find by email
  async findByEmail(email: string): Promise<User | null> {
    const u = await prisma.user.findUnique({
      where: {
        email,
      // isDeleted: false
     } });
    if (!u) return null;
    return this.toDomain(u);
  }

  // Find by ID
  async findById(id: string): Promise<User | null> {
    const u = await prisma.user.findUnique({
      where: {
        id,
      isDeleted: false
    } });
    if (!u) return null;
    return this.toDomain(u);
  }

  // Update user
  async update(id: string, data: Partial<User>): Promise<User> {
    const updated = await prisma.user.update({
      where: { id },
      data: {
        fullName: data.fullName,
        email: data.email,
        role: data.role,
        status: data.status,
        passwordHash: data.passwordHash,
        isDeleted: typeof data.isDeleted === 'boolean' ? data.isDeleted : undefined,
      },
    });

    return this.toDomain(updated);
  }

  // Delete user
  async delete(id: string, data: Partial<User>): Promise<User> {
    const deleted =  await prisma.user.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });
    return this.toDomain(deleted);
  }

  // Find all users
  async findAll(): Promise<User[]> {
    const users = await prisma.user.findMany({
      where: {
        isDeleted: false
      },
      orderBy: { createdAt: "desc" },
    });

    return users.map(this.toDomain);
  }

  // Find users by agent
  async findByAgentId(agentId: string): Promise<User[]> {
    const users = await prisma.user.findMany({
      where: { agentId },
      orderBy: { createdAt: "desc" },
    });
    return users.map(this.toDomain);
  }

  // Find users by biller
  async findByBillerId(billerId: string): Promise<User[]> {
    const users = await prisma.user.findMany({
      where: { billerId },
      orderBy: { createdAt: "desc" },
    });
    return users.map(this.toDomain);
  }

  // Get password hash by email
  async getHashByEmail(email: string): Promise<string | null> {
    const u = await prisma.user.findUnique({
      where: { email },
      select: { passwordHash: true },
    });
    return u?.passwordHash || null;
  }

  // Refresh token management
  async saveRefreshToken(
    userId: string,
    token: string,
    expiresAt: Date,
  ): Promise<RefreshToken> {
    return prisma.refreshToken.create({
      data: { userId, token, expiresAt },
    });
  }

  async findRefreshToken(token: string) {
    return prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    });
  }

  async deleteRefreshToken(token: string) {
    return prisma.refreshToken.delete({ where: { token } });
  }

  async revokeAllUserTokens(userId: string) {
    return prisma.refreshToken.deleteMany({ where: { userId } });
  }
}
