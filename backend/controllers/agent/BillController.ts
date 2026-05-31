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
      const body = request.body as any;
      const reqAny = request as any;

      // 1. Discover the secure logged-in agent identity
      let fallbackAgentId = body.agentId || body.agent_id;
      let agentCode = request.headers["x-agent-code"] as string;

      if (reqAny.agent?.id) {
        fallbackAgentId = reqAny.agent.id;
        agentCode = reqAny.agent.code;
      } else if (reqAny.user?.agentId) {
        fallbackAgentId = reqAny.user.agentId;
      }

      // If missing, look up agent data using database user contexts
      if ((!fallbackAgentId || !agentCode) && reqAny.user?.id) {
        const structuralAgent = await prisma.agent.findFirst({
          where: {
            OR: [
              { id: reqAny.user.id },
              { users: { some: { id: reqAny.user.id } } }
            ]
          },
          select: { id: true, code: true }
        });
        if (structuralAgent) {
          if (!fallbackAgentId) fallbackAgentId = structuralAgent.id;
          if (!agentCode) agentCode = structuralAgent.code;
        }
      }

      // Operational Guard Rails
      if (!body.billId && !body.bill_id) {
        return reply.status(400).send({ success: false, message: "Validation Error: Missing valid Bill Identifier context." });
      }
      if (!fallbackAgentId) {
        return reply.status(400).send({ success: false, message: "Validation Error: Missing valid Agent identity session context." });
      }

      // 2. AUTOMATIC INFERENCE: Extract cleanly from the agent's code profile identifier 
      // If code is "CBE-1001", default derived value automatically splits down to "CBE"
      let inferredMethod = "CASH"; 
      if (agentCode) {
        const upperCode = agentCode.toUpperCase();
        if (upperCode.startsWith("CBE")) inferredMethod = "CBE";
        else if (upperCode.startsWith("TELEBIRR")) inferredMethod = "TELEBIRR";
      }

      // 3. Assemble pristine execution parameters
      const servicePayload = {
        billId: String(body.billId || body.bill_id),
        agentId: String(fallbackAgentId),
        transactionId: String(body.transactionId || body.transaction_id),
        amount: Number(body.amount),
        paymentMethod: inferredMethod as any, // Autocalculated seamlessly without interface exposure
        idempotencyKey: String(body.idempotencyKey || body.idempotency_key),
        payerPhone: body.payerPhone || body.payer_phone ? String(body.payerPhone || body.payer_phone) : "0000000000",
      };

      // Call Service Transaction Logic Engine
      const result = await this.agentService.confirmPayment(servicePayload);
      
      return reply.send(result);
    } catch (error: any) {
      console.error("Payment Processing Error at Controller Level:", error.message || error);
      return reply.status(400).send({ 
        success: false, 
        message: error.message || "Bad Request encountered during transaction generation execution." 
      });
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