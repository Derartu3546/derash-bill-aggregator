export type UserRole = 'SUPER_ADMIN' | 'BILLER_ADMIN' | 'AGENT_USER';

 export  class User {
    constructor(
        public readonly id: string,
        public readonly email: string,
        public readonly role: UserRole,
        public readonly password: string,
        public readonly name: string,
        public readonly isActive: boolean = true,
        public readonly biller_id?: string,
        public readonly agent_id?: string,
        public readonly agent?: {
            code: string;
            api_key: string;
            name:string;
        },
        public readonly biller?: {
            id: string;
            name: string;
        }
    ) { }
    
    // Business Rule: Can this use upload bills?
    canIngestBills(): boolean {
        return this.role === 'SUPER_ADMIN' || this.role === 'BILLER_ADMIN';
    }
    // Business Rule: Can this use process payments?
    canProcessPayments(): boolean{
        return this.role === 'SUPER_ADMIN' || this.role === 'AGENT_USER';
    }
}

