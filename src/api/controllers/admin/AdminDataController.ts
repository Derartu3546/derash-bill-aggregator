import { FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from "@/core/lib/prisma.ts"
import { AgentService } from '@/core/services/AgentService.ts';

export class AdminDataController {
  private agentService = new AgentService();

getAdminReport = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
 
    const { agent_id, biller_id, fromDate, toDate } = request.query as { 
      agent_id?: string, 
      biller_id?: string, 
      fromDate?: string, 
      toDate?: string 
    };

    const [report, summary] = await Promise.all([
    
      this.agentService.getFullReport({ 
        agent_id, 
        biller_id, 
        fromDate, 
        toDate 
      }),
     
      this.agentService.getDailySummary(agent_id, fromDate || toDate)
    ]);

    return reply.send({
      status: "SUCCESS",
      scope: "PLATFORM_GLOBAL",
      generated_at: new Date().toISOString(),
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

  static getUsers = async (request: FastifyRequest, reply: FastifyReply) => {
    const users = await prisma.customer.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return reply.send(users);
  };

  static getAgents = async (request: FastifyRequest, reply: FastifyReply) => {
    const agents = await prisma.agent.findMany({
      orderBy: { name: 'asc' }
    });
    return reply.send(agents);
  };

  static getBillers = async (request: FastifyRequest, reply: FastifyReply) => {
    const billers = await prisma.biller.findMany({
      orderBy: { name: 'asc' }
    });
    return reply.send(billers);
  };
}