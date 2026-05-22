import { prisma } from '../config/prisma';
import { IUserRepository } from './IUserRepository';
import { User, UserRole } from './User';
import { RefreshToken } from '@prisma/client';

export class PrismaUserRepository implements IUserRepository {
  // ========== User Settings Methods (properly implemented) ==========
  async getUserSettings(userId: string): Promise<any> {
    let settings = await prisma.userSettings.findUnique({
      where: { userId },
    });
    // Auto-create default settings if not exist
    if (!settings) {
      settings = await prisma.userSettings.create({
        data: { userId },
      });
    }
    return settings;
  }

  async updateUserSettings(userId: string, data: any): Promise<any> {
    // Use upsert to handle missing record gracefully
    return prisma.userSettings.upsert({
      where: { userId },
      update: data,
      create: { userId, ...data },
    });
  }

  // Rest of your existing methods (unchanged)
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

  async findByEmail(email: string): Promise<User | null> {
    const u = await prisma.user.findUnique({ where: { email } });
    if (!u) return null;
    return this.toDomain(u);
  }

  async findById(id: string): Promise<User | null> {
    const u = await prisma.user.findUnique({ where: { id, isDeleted: false } });
    if (!u) return null;
    return this.toDomain(u);
  }

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
        mustChangePassword: data.mustChangePassword,
      },
    });
    return this.toDomain(updated);
  }

  async delete(id: string, data: Partial<User>): Promise<User> {
    const deleted = await prisma.user.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date() },
    });
    return this.toDomain(deleted);
  }

  async findAll(): Promise<User[]> {
    const users = await prisma.user.findMany({
      where: { isDeleted: false },
      orderBy: { createdAt: "desc" },
    });
    return users.map(this.toDomain);
  }

  async findByAgentId(agentId: string): Promise<User[]> {
    const users = await prisma.user.findMany({
      where: { agentId },
      orderBy: { createdAt: "desc" },
    });
    return users.map(this.toDomain);
  }

  async findByBillerId(billerId: string): Promise<User[]> {
    const users = await prisma.user.findMany({
      where: { billerId },
      orderBy: { createdAt: "desc" },
    });
    return users.map(this.toDomain);
  }

  async getHashByEmail(email: string): Promise<string | null> {
    const u = await prisma.user.findUnique({
      where: { email },
      select: { passwordHash: true },
    });
    return u?.passwordHash || null;
  }

  // ========== Refresh Token Methods ==========
  async findRefreshToken(token: string) {
    return prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    });
  }

  async deleteRefreshToken(token: string) {
    return prisma.refreshToken.delete({ where: { token } });
  }

  async saveRefreshToken(userId: string, token: string, expiresAt: Date) {
    return prisma.refreshToken.create({
      data: { userId, token, expiresAt },
    });
  }

  async revokeAllUserTokens(userId: string) {
    return prisma.refreshToken.deleteMany({ where: { userId } });
  }

  async completeOnboarding(userId: string, newPasswordHash: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash, mustChangePassword: false },
    });
  }

  async updateResetToken(userId: string, token: string, expiresAt: Date): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { resetToken: token, resetTokenExpires: expiresAt },
    });
  }

  async findByResetToken(token: string): Promise<User | null> {
    const user = await prisma.user.findFirst({
      where: { resetToken: token, resetTokenExpires: { gt: new Date() } },
    });
    if (!user) return null;
    return this.toDomain(user);
  }

  async updatePassword(userId: string, newHash: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });
  }
}