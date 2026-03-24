import { FastifyRequest, FastifyReply } from 'fastify';
import { AgentService } from '../../../core/services/AgentService.ts';

// src/api/controllers/agent/BillController.ts

export class BillController {
  private agentService = new AgentService();

 // src/api/controllers/agent/BillController.ts

getBillInfo = async (request: FastifyRequest, reply: FastifyReply) => {
  const { reference } = request.params as { reference: string };
  
  // Try to get agent_code from Headers OR Query String (for flexibility)
  const agentCode = (request.headers['x-agent-code'] as string) || 
                    (request.query as any)?.agent_code;

  // IMPORTANT: If agentCode is missing, stop here with a clear error
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
    return reply.status(400).send({ success: false, error: error.message });
  }
};

  processPayment = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // The body now contains the AUTO-GENERATED data from getBillInfo
      const result = await this.agentService.confirmPayment(request.body as any);
      return reply.send({ success: true, data: result });
    } catch (error: any) {
      return reply.status(400).send({ success: false, error: error.message });
    }
  };

getAgentReport = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    // We get the agent ID from the middleware's hard work
    const agent = (request as any).agent;

    const report = await this.agentService.getFullReport(agent.id);
    return reply.send({ 
      status: "SUCCESS", 
      agent_name: agent.name, // "Telebirr"
      data: report });
  } catch (error: any) {
    return reply.status(400).send({ status: "ERROR", message: error.message });
  }
};
 
}
