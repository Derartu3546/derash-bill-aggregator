import { FastifyInstance } from "fastify";
import { CreateAgentUseCase } from "../../application/use-cases/agent/CreateAgentUseCase";
import { PrismaAgentRepository } from "../../infrastructure/repositories/PrismaAgentRepository";
import { authenticate } from "../hooks/auth.hook";
import { request } from "node:http";
import { CreateAgentSchema } from "../../shared/validators/agent.validator";
import { IngestBillSchema } from "../../shared/validators/biller.validator";
import { PrismaAuditRepository } from "../../infrastructure/repositories/PrismaAuditRepository";
import { CreateAuditLogUseCase } from "../../application/use-cases/admin/CreateAuditLogUseCase";

const agentRepo = new PrismaAgentRepository();
const auditRepo = new PrismaAgentRepository();
const createAgentUC = new CreateAgentUseCase(agentRepo);
const createAuditUseCase = new CreateAuditLogUseCase(auditRepo);


export async function agentRoutes(fastify: FastifyInstance){
    // Create Agent 
    fastify.post(
        "/agents",
        { preHandler: authenticate },
        async (request, reply) => {
        const validateData = CreateAgentSchema.parse(request.body);
        const agent = await createAgentUC.execute(
            validateData,
            (request as any).user.role,
            );
            // await createAuditUseCase.execute({
            //   userId: request.user.id,
            //   userEmail: request.user.email,
            //   action: "CREATE_AGENT",
            //   entityName: "Agent",
            //   entityId: agent.id,
            //   newValues: {
            //     agentName: agent.fullName,
            //     agentCode: agent.agentCode,
            //     location: agent.location,
            //   },
            //   ipAddress: request.ip,
            //   status: "SUCCESS",
            // });
        return { status: 'SUCCESS', agent };
        });
    fastify.get("/agents", { preHandler: [authenticate] }, async (request, reply) => {
        const agents = await agentRepo.findAll({ page: 1, limit: 100 });
        return { status: 'SUCCESS', data: agents };
    });

    fastify.put("/agents/:id", { preHandler: [authenticate] }, async (request, reply) => {
        const { id } = request.params as any;
        const { name, code, isEnabled , isDeleted} = request.body as any;

        const updated = await agentRepo.update({
            id, name, code, isEnabled, isDeleted
        });
        return {status:'SUCCESS', data:updated}
    });

    fastify.delete('/agents/:id', { preHandler: [authenticate] }, async (request, reply) => {
        const { id } = request.params as any;
        await agentRepo.delete(id);
        return { status: "SUCCESS", message: "Agent deleted" };
    })
}



