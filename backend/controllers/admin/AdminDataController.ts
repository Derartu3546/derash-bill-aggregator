import { FastifyReply, FastifyRequest } from "fastify";
import { prisma } from "../../config/prisma";
import { AgentService } from "../../services/agent/AgentService";

export class AdminDataController {
  private agentService = new AgentService();

  // Existing method
  getAdminReport = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { agent_id, biller_id, fromDate, toDate } = request.query as {
        agent_id?: string;
        biller_id?: string;
        fromDate?: string;
        toDate?: string;
      };

      const [report, summary] = await Promise.all([
        this.agentService.getFullReport({
          agentId: agent_id,
          billerId: biller_id,
          fromDate,
          toDate,
        }),
        this.agentService.getDailySummary(agent_id, fromDate || toDate),
      ]);

      return reply.send({
        status: "SUCCESS",
        scope: "PLATFORM_GLOBAL",
        generatedAt: new Date().toISOString(),
        ...summary,
        report: report,
      });
    } catch (error: any) {
      console.error("Report Error:", error);
      return reply.status(400).send({
        status: "ERROR",
        message: "Failed to generate report. Check date format (YYYY-MM-DD)",
      });
    }
  };

  // ✅ NEW: Aggregated dashboard data for admin
  getDashboardData = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // 1. Get global stats
      const stats = await prisma.$transaction(async (tx) => {
        const totalUsers = await tx.user.count({ where: { isDeleted: false } });
        const totalAgents = await tx.agent.count({ where: { isDeleted: false } });
        const totalBillers = await tx.biller.count({ where: { isDeleted: false } });
        const totalTransactions = await tx.transaction.count({
          where: { status: "SUCCESSFUL" },
        });
        const totalRevenueAgg = await tx.transaction.aggregate({
          where: { status: "SUCCESSFUL" },
          _sum: { totalAmount: true },
        });
        const totalRevenue = totalRevenueAgg._sum.totalAmount || 0;
        return {
          totalUsers,
          totalAgents,
          totalBillers,
          totalTransactions,
          totalRevenue: Number(totalRevenue),
        };
      });

      // 2. Fetch all successful transactions (for trends, payment methods, top billers, recent)
      const transactions = await prisma.transaction.findMany({
        where: { status: "SUCCESSFUL" },
        orderBy: { createdAt: "desc" },
        include: {
          agent: { select: { name: true } },
          bill: { include: { biller: { select: { name: true } } } },
        },
      });

      // --- Monthly trends (last 6 months)
      const trendMap = new Map<string, number>();
      transactions.forEach((tx) => {
        const date = new Date(tx.createdAt);
        const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
        trendMap.set(key, (trendMap.get(key) || 0) + Number(tx.totalAmount));
      });
      const sorted = Array.from(trendMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));
      const trends = {
        labels: sorted.map(([k]) => k),
        values: sorted.map(([, v]) => v),
      };

      // --- Payment method distribution
      const methodCounts = { mobile: 0, internet: 0, agent: 0, bank: 0 };
      transactions.forEach((tx) => {
        const method = (tx.paymentMethod || "").toLowerCase();
        if (method.includes("mobile")) methodCounts.mobile++;
        else if (method.includes("internet") || method.includes("web")) methodCounts.internet++;
        else if (method.includes("agent")) methodCounts.agent++;
        else if (method.includes("bank")) methodCounts.bank++;
        else methodCounts.mobile++; // default
      });
      const totalTx = transactions.length || 1;
      const paymentMethods = {
        mobile: Math.round((methodCounts.mobile / totalTx) * 100),
        internet: Math.round((methodCounts.internet / totalTx) * 100),
        agent: Math.round((methodCounts.agent / totalTx) * 100),
        bank: Math.round((methodCounts.bank / totalTx) * 100),
      };

      // --- Top billers (by revenue)
      const billerMap = new Map<string, { name: string; transactions: number; revenue: number }>();
      transactions.forEach((tx) => {
        const name = tx.bill?.biller?.name || "Unknown";
        const existing = billerMap.get(name);
        if (existing) {
          existing.transactions++;
          existing.revenue += Number(tx.totalAmount);
        } else {
          billerMap.set(name, { name, transactions: 1, revenue: Number(tx.totalAmount) });
        }
      });
      const topBillers = Array.from(billerMap.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      // --- Recent transactions (last 10)
      const recentTransactions = transactions.slice(0, 10).map((tx) => ({
        id: tx.transactionId,
        amount: Number(tx.totalAmount),
        status: tx.status.toLowerCase(),
        date: tx.createdAt.toISOString().split("T")[0],
        biller: tx.bill?.biller?.name || "Unknown",
        agent: tx.agent?.name || "Unknown",
      }));

      return reply.send({
        status: "SUCCESS",
        data: {
          stats,
          trends,
          paymentMethods,
          topBillers,
          recentTransactions,
        },
      });
    } catch (error: any) {
      console.error("Dashboard data error:", error);
      return reply.status(500).send({
        status: "ERROR",
        message: "Failed to load dashboard data",
      });
    }
  };

  // Existing methods (unchanged)
  getUsers = async (request: FastifyRequest, reply: FastifyReply) => {
    const users = await prisma.customer.findMany({
      orderBy: { createdAt: "desc" },
    });
    return reply.send(users);
  };

  getAgents = async (request: FastifyRequest, reply: FastifyReply) => {
    const agents = await prisma.agent.findMany({
      orderBy: { name: "asc" },
    });
    return reply.send(agents);
  };

  getBillers = async (request: FastifyRequest, reply: FastifyReply) => {
    const billers = await prisma.biller.findMany({
      orderBy: { name: "asc" },
    });
    return reply.send(billers);
  };
}