import { prisma } from '../database/prisma.ts';
import { IBillerRepository } from '../../domain/repositories/IBillerRepository.ts';
import { Biller } from '../../domain/entities/Biller.ts';

export class PrismaBillerRepository implements IBillerRepository {
 
  private mapToEntity(data: any): Biller {
    return new Biller(
      data.id,
      data.name,
      data.code,
      data.category,
      data.allows_partial,
      data.isActive,
      data.createdAt,
      data.charges_late_fee,
      data.grace_period,
      data.account_no,
      data.apiEndPoint
    );
  }

  async create(biller: any): Promise<Biller> {
    const created = await prisma.biller.create({
      data: {
        name: biller.name,
        code: biller.code,
        category: biller.category,
        allows_partial: biller.allows_partial ?? false,
        // ✅ Added these to the database create call
        charges_late_fee: biller.charges_late_fee ?? true,
        grace_period: biller.grace_period ?? 0,
        account_no: biller.account_no,
        apiEndPoint: biller.apiEndPoint,
        isActive: biller.isActive ?? true,
      }
    });
    return this.mapToEntity(created);
  }

  async findByCode(code: string): Promise<Biller | null> {
    const data = await prisma.biller.findUnique({ where: { code } });
    return data ? this.mapToEntity(data) : null;
  }

  async findById(id: string): Promise<Biller | null> {
    const data = await prisma.biller.findUnique({ where: { id } });
    return data ? this.mapToEntity(data) : null;
  }

  async findAll(params?: { search?: string; page?: number; limit?: number }): Promise<Biller[]> {
    const search = params?.search ? params.search.trim() : undefined;
    const page = params?.page || 1;
    const limit = params?.limit || 100;
    const skip = (page - 1) * limit;

   const data = await prisma.biller.findMany({
        where: search ? {
            name: { contains: search, mode: 'insensitive' }
        } : {},
        skip: skip,
        take: limit,
        orderBy: { name: 'asc' }
    });

    return data.map(this.mapToEntity);
}

  async update(biller: any): Promise<Biller> {
    const updated = await prisma.biller.update({
      where: { id: biller.id },
      data: {
        name: biller.name,
        isActive: biller.isActive,
        allows_partial: biller.allows_partial,
        // ✅ Allow updating these business rules
        charges_late_fee: biller.charges_late_fee,
        grace_period: biller.grace_period,
        apiEndPoint: biller.apiEndPoint
      }
    });
    return this.mapToEntity(updated);
  }

  async delete(id: string): Promise<void> {
    await prisma.biller.delete({ where: { id } });
  }

  async count(): Promise<number> {
    return await prisma.biller.count();
  }

  async getBillerStats(billerId: string) {
    const [totals, statusBreakdown] = await Promise.all([
      prisma.bill.aggregate({
        where: { biller_id: billerId },
        _count: { _all: true },
        _sum: { amount_due: true }
      }),
      prisma.bill.groupBy({
        by: ['status'],
        where: { biller_id: billerId },
        _count: { _all: true },
        _sum: { amount_due: true }
      })
    ]);

    return {
      totalBills: totals._count._all,
      totalReceivableAmount: Number(totals._sum.amount_due) || 0,
      breakdown: statusBreakdown.map(item => ({
        status: item.status,
        count: item._count._all,
        amount: Number(item._sum.amount_due) || 0
      }))
    };
  }
}