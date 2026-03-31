import { prisma } from '../database/prisma';

export class PrismaAdminRepository {
  async getGlobalStats() {
    const [users, billers, agents, totalRevenue] = await Promise.all([
      prisma.user.count(),
      prisma.biller.count(),
      prisma.agent.count(),
      prisma.bill.aggregate({
        _sum: { amountPaid: true },
      }),
    ]);

    return {
      totalUsers: users,
      totalBillers: billers,
      totalAgents: agents,
      totalRevenue: totalRevenue._sum.amountPaid || 0,
    };
  }
}
