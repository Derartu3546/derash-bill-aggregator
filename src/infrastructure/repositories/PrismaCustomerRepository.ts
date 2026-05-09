import { ICustomerRepository } from "../../domain/repositories/ICustomerRepository";
import { Customer } from "../../domain/entities/Customer";
import { prisma } from '../database/prisma';


export class PrismaCustomerRepository implements ICustomerRepository{

    private toDomain(db: any): Customer{
        return new Customer({
            id: db.id,
            fullName: db.full_name,
            phoneNumber: db.phone_no,
            email: db.email ?? undefined,
            isActive: db.isActive,
            createdAt: db.createdAt,
            updatedAt: db.updatedAt
        });
    }

    private toPersistence(customer: Customer) {
        const fullName = customer.fullName;
        const phoneNumber = customer.phoneNumber;

        if (!fullName || !phoneNumber) {
            throw new Error("Customer fullName and phoneNumber are required for persistence");
        }

        return {
            full_name: fullName,
            phone_no: phoneNumber,
            email: customer.email ?? null,
            isActive: customer.isActive
        };
    }

    async findById(id: string): Promise<Customer | null> {
        const dbCustomer = await prisma.customer.findUnique({
            where: { id },
        });

        if (!dbCustomer) return null;

        return this.toDomain(dbCustomer);
    }

    async findByPhone(phoneNumber: string): Promise<Customer | null> {
        const dbCustomer = await prisma.customer.findUnique({
            where: { phone_no: phoneNumber }
        });

        if (!dbCustomer) return null;

        return this.toDomain(dbCustomer);
    }

    async findByEmail(email: string): Promise<Customer | null> {
        const dbCustomer = await prisma.customer.findUnique({
            where: { email }
        });

        if (!dbCustomer) return null;

        return this.toDomain(dbCustomer);
    }

    async create(customer: Customer): Promise<Customer>{
        const dbCustomer = await prisma.customer.create({
            data: this.toPersistence(customer)
        });

        return this.toDomain(dbCustomer);
    }

    async update(customer: Customer): Promise<Customer> {
        if (!customer.id) {
          throw new Error("Customer ID is required for update");
        }

        const dbCustomer = await prisma.customer.update({
            where: { id: customer.id },
            data: this.toPersistence(customer)
        });

        return this.toDomain(dbCustomer);
    }

    async findOrCreate(data: { fullName: string; phoneNumber: string; email?: string; }): Promise<Customer> {
        const existing = await prisma.customer.findUnique({
            where: { phone_no: data.phoneNumber }
        });

        if (existing) {
            return this.toDomain(existing);
        }

        try {
            const created = await prisma.customer.create({
                data: {
                    full_name: data.fullName,
                    phone_no: data.phoneNumber,
                    email: data.email ?? null
                }
            });
            return this.toDomain(created)
        } catch (error: any) {
            if (error.code === "P2002") {
              const retry = await prisma.customer.findUnique({
                where: { phone_no: data.phoneNumber },
              });

              if (retry) return this.toDomain(retry);
            }
            throw error;
        }
    }

    async findAll(params?: { skip?: number; take?: number; isActive?: boolean; }): Promise<Customer[]> {
        const dbCustomers = await prisma.customer.findMany({
          where: {
            isActive: params?.isActive,
          },
          skip: params?.skip,
          take: params?.take,
          orderBy: { createdAt: "desc" },
        });
        return dbCustomers.map((c) => this.toDomain(c));
    }
}