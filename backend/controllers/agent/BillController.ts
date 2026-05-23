import { prisma } from "../../config/prisma";
import { FastifyRequest, FastifyReply } from "fastify";
import { AgentService } from "../../services/agent/AgentService";

export class BillController {
  private agentService = new AgentService();

  getBillInfo = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { reference } = request.params as { reference: string };
      const reqAny = request as any;
      
      let agentCode = request.headers["x-agent-code"] as string;

      
      if (reqAny.agent?.code) {
        agentCode = reqAny.agent.code;
      } 
      
      else if (reqAny.user) {
        const session = reqAny.user;
        
        
        if (session.agentId) {
          const agent = await prisma.agent.findUnique({
            where: { id: session.agentId },
            select: { code: true }
          });
          if (agent) agentCode = agent.code;
        } 
       
        else if (session.id) {
          const agent = await prisma.agent.findFirst({
            where: {
              OR: [
                { id: session.id },
                { users: { some: { id: session.id } } }
              ]
            },
            select: { code: true }
          });
          if (agent) agentCode = agent.code;
        }
      }

     
      if (!agentCode) {
        return reply.status(403).send({
          success: false,
          error: "Forbidden",
          message: "Access Denied: Unable to safely map your request context to a registered Agent Code.",
        });
      }

     
      const bill = await this.agentService.inquiry(reference, agentCode);
      
      if (!bill) {
        return reply.status(404).send({ 
          success: false, 
          message: "No unpaid bill found with that reference identifier." 
        });
      }

      return reply.send({ 
        success: true, 
        data: bill 
      });

    } catch (error: any) {
      console.error("Bill Inquiry Error:", error);
      return reply.status(500).send({ 
        success: false, 
        message: "Internal Server Error during bill inquiry processing.",
        details: error.message 
      });
    }
  };

  getDashboard = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const reqAny = request as any;
      let agentId: string | null = null;

     
      if (reqAny.agent?.id) {
        agentId = reqAny.agent.id;
      } 
     
      else if (reqAny.user) {
        const session = reqAny.user;
        
        if (session.agentId) {
          agentId = session.agentId;
        } else if (session.id) {
          
          const foundAgent = await prisma.agent.findFirst({
            where: {
              OR: [
                { id: session.id },
                { users: { some: { id: session.id } } }
              ]
            },
            select: { id: true }
          });
          agentId = foundAgent ? foundAgent.id : null;
        }
      }

      if (!agentId) {
        return reply.status(403).send({
          success: false,
          error: "Forbidden",
          details: "Access Denied: Could not locate a valid Agent ID match for your request credentials.",
        });
      }

   
      const [stats, statusCounts, recentTransactions] = await Promise.all([
        prisma.transaction.aggregate({
          where: { agentId: agentId },
          _count: { id: true },
          _sum: { totalAmount: true },
        }),
        prisma.transaction.groupBy({
          by: ["status"],
          where: { agentId: agentId },
          _count: { id: true },
        }),
        prisma.transaction.findMany({
          where: { agentId: agentId },
          take: 10,
          orderBy: { createdAt: "desc" },
          include: {
            bill: {
              include: {
                customer: { select: { fullName: true } },
                biller: { select: { name: true } },
              },
            },
          },
        }),
      ]);

      const counts: Record<string, number> = {
        successful: 0,
        pending: 0,
        failed: 0,
      };

      statusCounts.forEach((item) => {
        const statusKey = item.status.toLowerCase();
        counts[statusKey] = item._count.id;
      });

      return reply.send({
        success: true,
        stats: {
          totalTransactions: stats._count.id || 0,
          successfulTransactions: counts.successful || 0,
          pendingTransactions: counts.pending || 0,
          failedTransactions: counts.failed || 0,
          totalRevenue: Number(stats._sum.totalAmount) || 0,
        },
        recentTransactions: recentTransactions || [],
      });

    } catch (error: any) {
      console.error("Dashboard Controller Error:", error);
      return reply.status(500).send({
        error: "Internal Server Error",
        details: error.message,
      });
    }
  };

  processPayment = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const result = await this.agentService.confirmPayment(
        request.body as any,
      );
      return reply.send(result);
    } catch (error: any) {
      return reply.status(400).send({ success: false, message: error.message });
    }
  };

  getAgentReport = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const reqAny = request as any;
      let agentId = reqAny.agent?.id || reqAny.user?.agentId;

      if (!agentId && reqAny.user?.id) {
        const agentLookup = await prisma.agent.findFirst({
          where: { users: { some: { id: reqAny.user.id } } },
          select: { id: true }
        });
        agentId = agentLookup?.id;
      }

      if (!agentId) {
        return reply.status(403).send({ status: "ERROR", message: "Unauthorized: No valid Agent identity context found." });
      }

      const { fromDate, toDate } = request.query as {
        fromDate?: string;
        toDate?: string;
      };

      const report = await this.agentService.getFullReport({
        agentId,
        fromDate,
        toDate,
      });

      return reply.send({
        status: "SUCCESS",
        agent_name: reqAny.agent?.name || "Agent Terminal",
        data: report,
      });
    } catch (error: any) {
      return reply
        .status(400)
        .send({ status: "ERROR", message: error.message });
    }
  };
}