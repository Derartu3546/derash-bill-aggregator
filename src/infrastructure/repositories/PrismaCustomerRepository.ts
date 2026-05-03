import { prisma } from '../database/prisma.ts';
import { ICustomerRepository } from '../../domain/repositories/ICustomerRepository.ts';
import { Customer } from '../../domain/entities/Customer.ts';

export class PrismaCustomerRepository implements ICustomerRepository {
    private mapToEntity(data: any): Customer {
        return new Customer(
            data.id,
            data.full_name,
            data.phone_no,
            data.email,
            data.isActive,
            data.createdAt,
            data.updatedAt
        );
    }


    async findById(id: string): Promise<Customer | null> {
        const data = await prisma.customer.findUnique({ where: { id } });
        return data ? this.mapToEntity(data) : null;
    }

    async findByPhone(phone_no: string): Promise<Customer | null> {
        const data = await prisma.customer.findUnique({ where: { phone_no } });
        return data ? this.mapToEntity(data) : null;
    }

    async findByEmail(email: string): Promise<Customer | null> {
        const data = await prisma.customer.findUnique({ where: { email } });
        return data ? this.mapToEntity(data) : null;
    }

    async findFirst(): Promise<Customer | null> {
        const data = await prisma.customer.findFirst({
            orderBy: { createdAt: 'asc' } // Gets the very first seeded customer
        });
        return data ? this.mapToEntity(data) : null;
    }


    async create(data: any): Promise<Customer> {
        const created = await prisma.customer.create({
            data: {
                full_name: data.full_name,
                phone_no: data.phone_no,
                email: data.email,
                isActive: data.isActive ?? true
            }
        });
        return this.mapToEntity(created);
    }

    async update(id: string, data: any): Promise<Customer> {
        const updated = await prisma.customer.update({
            where: { id },
            data
        });
        return this.mapToEntity(updated);
    }

    async count():Promise<number> {
        return await prisma.customer.count();
    }
    async findAll(): Promise<Customer[]> {
        const data = await prisma.customer.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return data.map(this.mapToEntity);
    }
}