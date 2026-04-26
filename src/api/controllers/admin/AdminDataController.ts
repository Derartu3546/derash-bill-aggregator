import { FastifyReply, FastifyRequest } from 'fastify';
import { AgentService } from '../../../application/services/AgentService.ts';

import { PrismaAgentRepository } from '../../../infrastructure/repositories/PrismaAgentRepository.ts';
import { PrismaBillRepository } from '../../../infrastructure/repositories/PrismaBillRepository.ts';
import { PrismaTransactionRepository } from '../../../infrastructure/repositories/PrismaTransactionRepository.ts';
import { PrismaCustomerRepository } from '../../../infrastructure/repositories/PrismaCustomerRepository.ts';
import { PrismaBillerRepository } from '../../../infrastructure/repositories/PrismaBillerRepository.ts';

export class AdminDataController {
  private agentService: AgentService;
  private customerRepo: PrismaCustomerRepository;
  private agentRepo: PrismaAgentRepository;
  private billerRepo: PrismaBillerRepository;

  constructor() {
    // 1. Initialize Repositories
    this.customerRepo = new PrismaCustomerRepository();
    this.agentRepo = new PrismaAgentRepository();
    this.billerRepo = new PrismaBillerRepository();
    const billRepo = new PrismaBillRepository();
    const transactionRepo = new PrismaTransactionRepository();

    // 2. Inject Repositories into AgentService
    this.agentService = new AgentService(
      this.agentRepo,
      billRepo,
      transactionRepo,
      this.customerRepo,
      this.billerRepo
    );
  }

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
          agent_id,
          biller_id,
          fromDate,
          toDate,
        }),
        this.agentService.getDailySummary(agent_id, fromDate || toDate),
      ]);

      return reply.send({
        status: "SUCCESS",
        scope: "PLATFORM_GLOBAL",
        generated_at: new Date().toISOString(),
        ...summary,
        report: report,
      });
    } catch (error: any) {
      console.error("Report Error:", error);
      return reply.status(400).send({
        status: "ERROR",
        message: "Failed to generate report. Ensure date format is YYYY-MM-DD",
      });
    }
  };

  // Changed from static to instance method to use repositories
  getUsers = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const users = await this.customerRepo.findAll(); 
      return reply.send(users);
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  };

  getAgents = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Using the repo instead of direct prisma call
      const agents = await this.agentRepo.findAllActive(); 
      return reply.send(agents);
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  };

  getBillers = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
    
      const billers = await this.billerRepo.findAll(); 
      return reply.send(billers);
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  };
}