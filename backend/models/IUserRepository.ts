import { User, UserRole } from './User';
import { RefreshToken } from '@prisma/client';


export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findAll(): Promise<User[]>;
  create(user: User): Promise<User>;
  update(id: string, data: Partial<User>): Promise<User>;
  delete(id: string, data: Partial<User>): Promise<User>;
  findByAgentId(agentId: string): Promise<User[]>;
  findByBillerId(billerId: string): Promise<User[]>;
  getHashByEmail(email: string): Promise<string | null>;
  saveRefreshToken(
    userId: string,
    token: string,
    expiresAt: Date,
    userAgent?: string,
    ipAddress?: string
  ): Promise<RefreshToken>;
  completeOnboarding(userId: string, newPasswordHash: string): Promise<void>;
  updateResetToken(userId: string, token: string, expiresAt: Date): Promise<void>;
  findByResetToken(token: string): Promise<User | null>;
  updateUserSettings(userId: string, data: any): Promise<any>;
  getUserSettings(userId: string): Promise<any>;
}

