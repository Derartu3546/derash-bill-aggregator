import  {User,UserRole} from '../entities/User.ts';


export interface IUserRepository {
    findById(id: string): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    create(data: Omit<User, 'id' | 'isActive' | 'canIngestBills' | 'canProcessPayments'>): Promise<User>;
    update(user: User): Promise<User>;
    delete(id: string): Promise<void>;
    findByAgentId(agentId: string): Promise<User[]>;
    findByBillerId(billerId: string): Promise<User[]>;
    getHashByEmail(email: string): Promise<string | null>;
}

