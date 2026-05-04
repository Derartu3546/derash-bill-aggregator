import { User, UserRole } from '../entities/User';
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
  ): Promise<RefreshToken>;
  completeOnboarding(userId: string, newPasswordHash: string): Promise<void>;
}

