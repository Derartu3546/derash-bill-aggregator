import { FastifyInstance } from "fastify";
import { authenticate } from "../hooks/auth.hook";
import { LookupBillUseCase } from "../services/agent/LooupBillUseCase";
import { prisma } from '../config/prisma'


const lookUpBillUseCase = new LookupBillUseCase(prisma);

export async function billRoutes(fastify: FastifyInstance) {
    fastify.get('/bills/lookup', { preHandler: [authenticate] }, async (request, reply) => {
        const { billReference } = request.query as {
            billReference: string
        };

        if (!billReference) {
            return reply.status(400).send({
                status: 'FAILED',
                message: 'bill Reference is required for lookup'
            });
        }
        try {
            const bill = await lookUpBillUseCase.execute(billReference);
            return { status: 'SUCCESS', data: bill };
        } catch (e: any) {
            return reply.status(404).send({
                status: 'NOT_FOUND',
                message: e.message
            });
        }
    });
}