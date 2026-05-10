export type UserRole = 'SYSTEM_ADMIN' | 'BILLER_USER' | 'AGENT_USER';

 export  class User {
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
     public readonly resetToken?: string,
     public readonly resetTokenExpires?: Date
   ) {}

   // Business Rule: Can this use upload bills?
   canIngestBills(): boolean {
     return this.role === "SYSTEM_ADMIN" || this.role === "BILLER_USER";
   }
   // Business Rule: Can this use process payments?
   canProcessPayments(): boolean {
     return this.role === "SYSTEM_ADMIN" || this.role === "AGENT_USER";
   }
 }

