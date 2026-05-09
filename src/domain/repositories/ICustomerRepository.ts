import { Customer } from "../entities/Customer";


export interface ICustomerRepository {
    findById(id: string): Promise<Customer | null>;
    findByPhone(phoneNumber: string): Promise<Customer | null>;
    findByEmail(email: string): Promise<Customer | null>;


    create(customer: Customer): Promise<Customer>;
    update(customer: Customer): Promise<Customer>;

    findOrCreate(data: {
        fullName?: string;
        phoneNumber?: string;
        email?: string;
    }): Promise<Customer>;

    findAll(params?: {
        skip?: number;
        take?: number;
        isActive?: boolean;
    }): Promise<Customer[]>;
}