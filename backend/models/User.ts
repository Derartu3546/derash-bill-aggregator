export type UserRole = 'SYSTEM_ADMIN' | 'BILLER_USER' | 'AGENT_USER';

// Define clear inline interfaces for the relational objects matching your backend payload
export interface UserAgentRelation {
  id: string;
  code: string;
  apiKey: string;
  name: string;
}

export interface UserBillerRelation {
  id: string;
  name: string;
}

export class User {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly role: UserRole,
    public readonly fullName: string,
    public readonly status: string,
    public readonly passwordHash: string,
    public readonly isDeleted: string,
    public readonly billerId?: string,
    public readonly agentId?: string,
    public readonly mustChangePassword: boolean = true,
    public readonly resetToken?: string | null,      // ✅ allow null
    public readonly resetTokenExpires?: Date | null,  // ✅ allow null
    
    // 💡 Add your dynamic relations here as optional properties
    public readonly agent?: UserAgentRelation | null,
    public readonly biller?: UserBillerRelation | null
  ) {}

  // Business Rule: Can this user upload bills?
  canIngestBills(): boolean {
    return this.role === "SYSTEM_ADMIN" || this.role === "BILLER_USER";
  }
  
  // Business Rule: Can this user process payments?
  canProcessPayments(): boolean {
    return this.role === "SYSTEM_ADMIN" || this.role === "AGENT_USER";
  }
}