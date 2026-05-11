import { FastifyReply, FastifyRequest } from "fastify";
import { prisma } from "../../config/prisma";
import { AgentService } from "../../services/agent/AgentService";

export class AdminDataController {
  private agentService = new AgentService();

  // Changed to instance method for consistency
  getAdminReport = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // 1. Destructure her original query names
      const { agent_id, biller_id, fromDate, toDate } = request.query as {
        agent_id?: string;
        biller_id?: string;
        fromDate?: string;
        toDate?: string;
      };

      // 2. Pass them into the service using the names the Service expects
      const [report, summary] = await Promise.all([
        this.agentService.getFullReport({
          agentId: agent_id, // Map snake_case to camelCase
          billerId: biller_id, // Map snake_case to camelCase
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
  // Removed 'static' so you can use these in a single router instance
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
