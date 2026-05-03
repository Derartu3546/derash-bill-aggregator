import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../../../infrastructure/database/prisma.ts';
import { AgentService } from '@/application/services/AgentService.ts';


import { PrismaAgentRepository } from '../../../infrastructure/repositories/PrismaAgentRepository.ts';
import { PrismaBillRepository } from '../../../infrastructure/repositories/PrismaBillRepository.ts';
import { PrismaTransactionRepository } from '../../../infrastructure/repositories/PrismaTransactionRepository.ts';
import { PrismaCustomerRepository } from '../../../infrastructure/repositories/PrismaCustomerRepository.ts';
import { PrismaBillerRepository } from '../../../infrastructure/repositories/PrismaBillerRepository.ts';

export class BillController {
  private agentService: AgentService;
  private agentRepo: PrismaAgentRepository;

  constructor() {
   
    this.agentRepo = new PrismaAgentRepository();
    const billRepo = new PrismaBillRepository();
    const transactionRepo = new PrismaTransactionRepository();
    const customerRepo = new PrismaCustomerRepository();
    const billerRepo = new PrismaBillerRepository();

    
    this.agentService = new AgentService(
      this.agentRepo,
      billRepo,
      transactionRepo,
      customerRepo,
      billerRepo
    );
  }

  getBillInfo = async (request: FastifyRequest, reply: FastifyReply) => {
    const { reference } = request.params as { reference: string };

    const agentCode = (request.headers['x-agent-code'] as string) ||
                      (request.query as any)?.agent_code;

    if (!agentCode) {
      return reply.status(400).send({
        success: false,
        message: "Agent Code is required. Please provide it in 'x-agent-code' header."
      });
    }

    try {
      const bill = await this.agentService.inquiry(reference, agentCode);
      if (!bill) return reply.status(404).send({ success: false, message: "No unpaid bill found." });

      return reply.send({ success: true, data: bill });
    } catch (error: any) {
      return reply.status(400).send({ success: false, message: error.message });
    }
  };

  processPayment = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const result = await this.agentService.confirmPayment(request.body as any);
      return reply.send(result);
    } catch (error: any) {
      return reply.status(400).send({ success: false, message: error.message });
    }
  };

  getAgentReport = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const agent = (request as any).agent;

      const { fromDate, toDate } = request.query as { fromDate?: string; toDate?: string };

      const report = await this.agentService.getFullReport({ agent_id: agent.id, fromDate, toDate });

      return reply.send({
        status: "SUCCESS",
        agent_name: agent.name,
        data: report
      });
    } catch (error: any) {
      return reply.status(400).send({ status: "ERROR", message: error.message });
    }
  };

  getDashboard = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const agentCodeHeader = request.headers['x-agent-code'] as string;
      let agentId = (request as any).user?.id;

      
      if (!agentId && agentCodeHeader) {
        const agent = await this.agentRepo.findByCode(agentCodeHeader);
        agentId = agent?.id;
      }

      if (!agentId) {
        return reply.status(401).send({
          error: "Unauthorized",
          details: "No valid agent identification found in headers or session."
        });
      }

      
      const [stats, statusCounts, recentTransactions] = await Promise.all([
        prisma.transaction.aggregate({
          where: { agent_id: agentId },
          _count: { id: true },
          _sum: { total_amount: true },
        }),
        prisma.transaction.groupBy({
          by: ['status'],
          where: { agent_id: agentId },
          _count: { id: true },
        }),
        prisma.transaction.findMany({
          where: { agent_id: agentId },
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            bill: {
              include: {
                customer: { select: { full_name: true } },
                biller: { select: { name: true } }
              }
            }
          }
        })
      ]);

      const counts: Record<string, number> = {
        successful: 0,
        pending: 0,
        failed: 0
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
          totalRevenue: Number(stats._sum.total_amount) || 0,
        },
        recentTransactions: recentTransactions || []
      });

    } catch (error: any) {
      console.error("Dashboard Controller Error:", error);
      return reply.status(500).send({
        error: "Internal Server Error",
        details: error.message
      });
    }
  };
}