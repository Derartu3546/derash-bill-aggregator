import { FastifyInstance } from "fastify";
import { CreateAgentUseCase } from "../services/agent/CreateAgentUseCase";
import { PrismaAgentRepository } from "../models/PrismaAgentRepository";
import { authenticateSession } from "../hooks/auth.hook";
import { CreateAgentSchema } from "../shared/validators/agent.validator";
import { IngestBillSchema } from "../shared/validators/biller.validator";
import { PrismaAuditRepository } from "../models/PrismaAuditRepository";
import { CreateAuditLogUseCase } from "../services/admin/CreateAuditLogUseCase";
import { Agent } from "../models/Agent"; 

const agentRepo = new PrismaAgentRepository();
const auditRepo = new PrismaAuditRepository(); 
const createAgentUC = new CreateAgentUseCase(agentRepo);
const createAuditUseCase = new CreateAuditLogUseCase(auditRepo);

export async function agentsRoutes(fastify: FastifyInstance){
   
    fastify.post(
        "/agents",
        { preHandler: authenticateSession },
        async (request, reply) => {
            const bodyData = request.body as any;
            
            const alignedData = {
                name: bodyData.name,
                code: bodyData.code,
                isEnabled: bodyData.isEnabled,
                apiKey: bodyData.apiKey || bodyData.api_key 
            };

            const validateData = CreateAgentSchema.parse(alignedData);
            const agent = await createAgentUC.execute(
                validateData,
                (request as any).user.role,
            );

            return { status: 'SUCCESS', agent };
        });

    fastify.get("/agents", { preHandler: [authenticateSession] }, async (request, reply) => {
        const agents = await agentRepo.findAll({ page: 1, limit: 100 });
        
        const mappedAgents = (agents as any[]).map(agent => ({
            id: agent.id,
            name: agent.name,
            code: agent.code,
            isEnabled: agent.isEnabled,
            api_key: agent.apiKey 
        }));

        return { status: 'SUCCESS', data: mappedAgents };
    });

    fastify.put("/agents/:id", { preHandler: [authenticateSession] }, async (request, reply) => {
        const { id } = request.params as any;
        const { name, code, isEnabled, isDeleted, api_key, apiKey } = request.body as any;

       
        const agentUpdateInstance = new Agent(
            id,
            name,
            code,
            apiKey || api_key,
            isEnabled,         
            isEnabled,
            isDeleted ?? false
        );

        
        const updated = await agentRepo.update(agentUpdateInstance);
        
        return { status: 'SUCCESS', data: updated }
    });

    fastify.delete('/agents/:id', { preHandler: [authenticateSession] }, async (request, reply) => {
        const { id } = request.params as any;
        await agentRepo.delete(id);
        return { status: "SUCCESS", message: "Agent deleted" };
    })
}