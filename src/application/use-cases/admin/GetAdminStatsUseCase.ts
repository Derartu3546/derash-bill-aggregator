import { prisma } from '../../../infrastructure/database/prisma';


async function getAdminDashboardStats() {
    const [
        totalActiveUsers,
        totalActiveBillers,
        totalActiveAgents,
        totalActiveTransactions,
        paidTransactionRevenue
    ] = await Promise.all([
        prisma.user.count({
            where: {
                isDeleted: false
            }
        }),
        prisma.biller.count({
            where: {
                isDeleted: false
            }
        }),
        prisma.agent.count({
            where: {
                isDeleted: false
            }
        }),
        prisma.bill.count({
            where: {
                isDeleted: false
            }
        }),
        prisma.bill.aggregate({
            _sum: { amountPaid: true },
            where: {
                status: 'PAID',
                isDeleted: false
            }
        })
    ]);
    return {
        totalUsers: totalActiveUsers,
        totalBillers: totalActiveBillers,
        totalAgents: totalActiveAgents,
        totalTransactions: totalActiveTransactions,
        totalRevenue: paidTransactionRevenue._sum.amountPaid || 0,
    }
}