import { FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from "@/core/lib/prisma.ts"
import { AgentService } from '@/core/services/AgentService.ts';

export class AdminDataController {
  private agentService = new AgentService();

  // 1. Get Admin Report
  getAdminReport = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { agent_id, date } = request.query as { agent_id?: string, date?: string };

      const [report, summary] = await Promise.all([
        this.agentService.getFullReport(agent_id),
        this.agentService.getDailySummary(agent_id, date)
      ]);

      return reply.send({
        status: "SUCCESS",
        scope: "PLATFORM_GLOBAL",
        generated_at: new Date().toISOString(),
        // FIX: Use the spread operator to flatten the summary into the root object
        ...summary, 
        report: report
      });

    } catch (error: any) {
      console.error("Report Error:", error);
      return reply.status(400).send({ 
        status: "ERROR", 
        message: "Failed to generate report. Ensure date format is YYYY-MM-DD" 
      });
    }
  };

  // 2. Get all registered Customers
  static getUsers = async (request: FastifyRequest, reply: FastifyReply) => {
    const users = await prisma.customer.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return reply.send(users);
  };

  // 3. Get all Agents
  static getAgents = async (request: FastifyRequest, reply: FastifyReply) => {
    const agents = await prisma.agent.findMany({
      orderBy: { name: 'asc' }
    });
    return reply.send(agents);
  };

  // 4. Get all Billers
  static getBillers = async (request: FastifyRequest, reply: FastifyReply) => {
    const billers = await prisma.biller.findMany({
      orderBy: { name: 'asc' }
    });
    return reply.send(billers);
  };
}