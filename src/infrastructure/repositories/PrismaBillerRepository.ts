import { prisma } from '../database/prisma';
import { IBillerRepository } from '../../domain/repositories/IBillerRepository';
import { Biller } from '../../domain/entities/Biller';



export class PrismaBillerRepository implements IBillerRepository {
  private mapToEntity(data: any): Biller {
    return new Biller(
      data.id,
      data.name,
      data.code,
      data.category,
      data.allowsPartial,
      data.isActive,
      data.createdAt,
    );
  }

  async create(biller: any): Promise<Biller> {
    const created = await prisma.biller.create({ data: biller });
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

  async findAll(params: { search?: string; page: number; limit: number }): Promise<Biller[]> {
    const skip = (params.page - 1) * params.limit;
    const where = params.search
      ? {
          OR: [
            { name: { contains: params.search, mode: "insensitive" as const } },
            { code: { contains: params.search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const data = await prisma.biller.findMany({ where, skip, take: params.limit });
    return data.map(this.mapToEntity);
  }

  async update(biller: any): Promise<Biller> {
    throw new Error("Not implemented");
  }
  async delete(id: string): Promise<void> {
    throw new Error("Not implemented");
  }

  async getBillerStats(billerId: string) {
    const totals = await prisma.bill.aggregate({
      where: { billerId },
      _count: { _all: true },
      _sum: { amount: true }
    });

    const statusBreakdown = await prisma.bill.groupBy({
      by: ['status'],
      where: { billerId },
      _count: { _all: true },
      _sum: { amount: true }
    });

    return {
      totalBills: totals._count._all,
      totalReceivableAmount: totals._sum.amount || 0,
      breakdown: statusBreakdown.map(item => ({
        status: item.status,
        count: item._count._all,
        amount: item._sum.amount || 0
      }))
    };
  }
}
