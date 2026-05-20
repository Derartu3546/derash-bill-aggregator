import { FastifyInstance } from "fastify";
import { CreateAgentUseCase } from "../services/agent/CreateAgentUseCase";
import { PrismaAgentRepository } from "../models/PrismaAgentRepository";
import {authenticateSession } from "../hooks/auth.hook";
import { CreateAgentSchema } from "../shared/validators/agent.validator";
import { IngestBillSchema } from "../shared/validators/biller.validator";
import { PrismaAuditRepository } from "../models/PrismaAuditRepository";
import { CreateAuditLogUseCase } from "../services/admin/CreateAuditLogUseCase";


const agentRepo = new PrismaAgentRepository();
const auditRepo = new PrismaAgentRepository();
const createAgentUC = new CreateAgentUseCase(agentRepo);
const createAuditUseCase = new CreateAuditLogUseCase(auditRepo);


export async function agentsRoutes(fastify: FastifyInstance){
    // Create Agent 
    fastify.post(
        "/agents",
        { preHandler: authenticateSession },
        async (request, reply) => {
        const validateData = CreateAgentSchema.parse(request.body);
        const agent = await createAgentUC.execute(
            validateData,
            (request as any).user.role,
            );

        return { status: 'SUCCESS', agent };
        });
    fastify.get("/agents", { preHandler: [authenticateSession] }, async (request, reply) => {
        const agents = await agentRepo.findAll({ page: 1, limit: 100 });
        return { status: 'SUCCESS', data: agents };
    });

    fastify.put("/agents/:id", { preHandler: [authenticateSession] }, async (request, reply) => {
        const { id } = request.params as any;
        const { name, code, isEnabled , isDeleted} = request.body as any;

        const updated = await agentRepo.update({
            id, name, code, isEnabled, isDeleted
        });
        return {status:'SUCCESS', data:updated}
    });

    fastify.delete('/agents/:id', { preHandler: [authenticateSession] }, async (request, reply) => {
        const { id } = request.params as any;
        await agentRepo.delete(id);
        return { status: "SUCCESS", message: "Agent deleted" };
    })
}



