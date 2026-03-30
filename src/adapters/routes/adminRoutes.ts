import { FastifyInstance } from "fastify";
import { authenticate } from "../hooks/auth.hook";
import { PrismaAuditRepository } from "../../infrastructure/repositories/PrismaAuditRepository";
import { CreateAuditLogUseCase } from "../../application/use-cases/admin/CreateAuditLogUseCase";


const auditRepo = new PrismaAuditRepository();
const createAuditUseCase = new CreateAuditLogUseCase(auditRepo);

export async function adminRoutes(fastify: FastifyInstance) {
    fastify.get('/logs', { preHandler: [authenticate] }, async (request, reply) => {
        if ((request as any).user.role !== "SYSTEM_ADMIN") {
            return reply.status(403).send({ message: 'Access Denied: Only Admins can View logs' });
        }
        const logs = await auditRepo.findAll();
        return {status:'SUCCESS', data: logs}
    })
}