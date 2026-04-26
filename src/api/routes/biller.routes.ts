import { FastifyInstance } from "fastify";
import { CreateBillerUseCase } from "../../application/use-cases/biller/CreateBillerUseCase.ts";
import { PrismaBillerRepository } from "../../infrastructure/repositories/PrismaBillerRepository.ts";
import { IngestBillUseCase } from "../../application/use-cases/biller/IngestBillUseCase.ts";
import { PrismaBillRepository } from "../../infrastructure/repositories/PrismaBillRepository.ts";
import { GetBillerStatsUseCase } from "../../application/use-cases/biller/GetBillerStatusUseCase.ts";
import { prisma } from "../../infrastructure/database/prisma.ts";

// Updated Hooks
import { authorize } from "@/core/hooks/auth.hook.ts";

// Validators & Utils
import { CreateBillerSchema, IngestBillSchema } from "../../shared/validators/biller.validator.ts";
import { parseCsv } from "../../shared/utils/csvParser.ts";
import { ApiResponse } from "../../shared/utils/ApiResponse.ts";

const billRepo = new PrismaBillRepository();
const billerRepo = new PrismaBillerRepository();
const createBillerUC = new CreateBillerUseCase(billerRepo);
const ingestUseCase = new IngestBillUseCase(billRepo);
const statsUseCase = new GetBillerStatsUseCase(billRepo);

export async function billerRoutes(fastify: FastifyInstance) {
    
    // Apply Global Protection to all routes in this file
    // Allowing both SUPER_ADMIN and BILLER roles
    fastify.addHook('preHandler', authorize(['SUPER_ADMIN', 'BILLER_ADMIN', 'AGENT_USER']));

    // 1. Create Biller 
    fastify.post("/billers", async (request, reply) => {
        const validatedData = CreateBillerSchema.parse(request.body); 
        const biller = await createBillerUC.execute(
          validatedData,
          (request as any).user.role,
        );
        return { status: "SUCCESS", biller };
    });

    // 2. Ingest Single Bill
    fastify.post('/billers/:billerId/bills', async (request, reply) => {
        try {
            const { billerId } = request.params as any;
            const user = (request as any).user;
            const validateBills = IngestBillSchema.parse(request.body);
            const result = await ingestUseCase.execute(validateBills, billerId, user);
            return { status: 'SUCCESS', ...result }
        } catch (e: any) {
            if (e.name === 'ZodError') { // Fixed typo
                return reply.status(400).send({
                    status: 'VALIDATION_ERROR',
                    errors: e.errors.map((err: any) => ({ field: err.path[1], message: err.message }))
                });
            }
            return reply.status(403).send({ status: 'FAILED', message: e.message });
        }
    });

    // 3. CSV Upload (Logic should eventually move to a Controller)
    fastify.post('/billers/:billerId/upload-bills', async (request, reply) => {
        try {
            const { billerId } = request.params as any;
            const user = (request as any).user;

            const data = await request.file();
            if (!data) throw new Error('No file uploaded');

            const fileBuffer = await data.toBuffer();
            const rawBills = await parseCsv(fileBuffer);

            const finalBills = rawBills.map(b => ({
                bill_reference: (b.bill_reference || b.reference)?.toString().trim(),
                full_name: (b.full_name || b.customerName || b.Name)?.toString().trim() || 'N/A',
                amount_due: parseFloat(b.amount_due || b.Amount_due || b.Value),
                period: (b.period || b.Period || b.Month)?.toString().trim()
            }));

            if (finalBills.some(b => isNaN(b.amount_due))) {
                throw new Error('Invalid amount found in CSV. Please ensure all amounts are numbers.');
            }

            const result = await ingestUseCase.execute(finalBills, billerId, user);
            return ApiResponse.success(result, 'CSV processed successfully');
        }
        catch (e: any) {
            return reply.status(400).send(ApiResponse.error(e.message));
        }
    });

    // 4. Biller Stats
    fastify.get('/billers/:billerId/stats', async (request, reply) => {
        try {
            const { billerId } = request.params as any;
            const user = (request as any).user;
            const stats = await statsUseCase.execute(billerId, user);
            return ApiResponse.success(stats, 'Biller financial insights retrieved');
        } catch (e: any) {
            return reply.status(403).send(ApiResponse.error(e.message));
        }
    });

    // 5. List All Billers
    fastify.get('/billers', async (request, reply) => {
        try {
            const billers = await prisma.biller.findMany({
                orderBy: { createdAt: 'desc' }
            });
            return reply.send({
                status: 'SUCCESS',
                message: 'Billers retrieved successfully',
                data: billers
            });
        } catch (error) {
            return reply.status(500).send({ // Fixed 5000 to 500
                status: 'ERROR',
                message: 'Failed to fetch billers'
            });
        }
    });
}