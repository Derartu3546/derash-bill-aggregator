import { User, UserRole } from '../entities/User';
import { RefreshToken } from '@prisma/client';


export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(user: User): Promise<User>;
  update(user: User): Promise<User>;
  delete(id: string): Promise<void>;
  findByAgentId(agentId: string): Promise<User[]>;
  findByBillerId(billerId: string): Promise<User[]>;
  getHashByEmail(email: string): Promise<string | null>;
  saveRefreshToken(
    userId: string,
    token: string,
    expiresAt: Date,
  ): Promise<RefreshToken>;
// findRefreshToken(token: string): Promise<(RefreshToken & { user: User }) | null>;
//   deleteRefreshToken(token: string): Promise<RefreshToken>;
//     revokeAllUserTokens(userId: string): Promise<{count: number}>;
}

