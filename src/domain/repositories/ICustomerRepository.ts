import { Customer } from '../entities/Customer.ts';

export interface ICustomerRepository {
    findById(id: string): Promise<Customer | null>;
    findByPhone(phone_no: string): Promise<Customer | null>;
    findByEmail(email: string): Promise<Customer | null>;
    findAll(): Promise<Customer[]>;
    findFirst(): Promise<Customer | null>;
    count(): Promise<number>;
    create(data: any): Promise<Customer>;
    update(id: string, data: any): Promise<Customer>;
}