import { FastifyInstance } from "fastify";
import { CreateBillerUseCase } from "../../application/use-cases/biller/CreateBillerUseCase";
import { PrismaBillerRepository } from "../../infrastructure/repositories/PrismaBillerRepository";
import { IngestBillUseCase } from "../../application/use-cases/biller/IngestBillUseCase";
import { PrismaBillRepository } from "../../infrastructure/repositories/PrismaBillRepository";
import { authenticate } from "../hooks/auth.hook";
import { request } from "node:http";
import { CreateBillerSchema } from "../../shared/validators/biller.validator";
import { IngestBillSchema } from "../../shared/validators/biller.validator";
import { parseCsv } from "../../shared/utils/csvParser";
import { ApiResponse } from "../../shared/utils/ApiResponse";
import { GetBillerStatsUseCase } from "../../application/use-cases/biller/GetBillerStatusUseCase";
import { prisma } from "../../infrastructure/database/prisma";
    
const billRepo = new PrismaBillRepository();
const billerRepo = new PrismaBillerRepository();
const createBillerUC = new CreateBillerUseCase(billerRepo);
const ingestUseCase = new IngestBillUseCase(billRepo);
const statsUseCase = new GetBillerStatsUseCase(billRepo);


export async function billerRoutes(fastify: FastifyInstance) {
    // Create Biller 
    fastify.post(
      "/billers",
      { preHandler: authenticate },
      async (request, reply) => {
        const validatedData = CreateBillerSchema.parse(request.body); 
        const biller = await createBillerUC.execute(
          validatedData,
          (request as any).user.role,
        );
        return { status: "SUCCESS", biller };
      },
    );


    fastify.post('/billers/:billerId/bills', { preHandler: authenticate }, async (request, reply) => {
        try {
            const { billerId } = request.params as any;
            const user = (request as any).user;
            const validateBills = IngestBillSchema.parse(request.body);
            const result = await ingestUseCase.execute(validateBills, billerId, user);
            return { status: 'SUCCESS', ...result }
        } catch (e: any) {
            if (e.name === 'ZodeError') {
                return reply.status(400).send({
                    status: 'VALIDATION_ERROR',
                    errors: e.errors.map((err: any) => ({
                        field: err.path[1], message: err.message
                    }))
                });
            }
            return reply.status(403).send({ status: 'FAILED', message: e.message });
        }
    });

    fastify.post('/billers/:billerId/upload-bills', { preHandler: authenticate }, async (request, reply) => {
        try {
            const { billerId } = request.params as any;
            const user = (request as any).user;

            // Get the file from the request
            const data = await request.file();
            if (!data) throw new Error('No file uploaded');

            // Parse CSV to JSON Array
            const fileBuffer = await data.toBuffer();
            const rawBills = await parseCsv(fileBuffer);
            // Format & Validate (Convert strings to numbers from CSV)
            const formattedBills = rawBills.map(b => {
                const billReference =
                  b.billReference || b.billReference || b.reference;
                const amount = b.amount || b.Amount || b.Value;
                const period = b.period || b.Period || b.Month;
                const customerName = b.customerName || b.Customer || b.Name;

                return { billReference, amount, period, customerName, raw: b };
            });

            formattedBills.forEach((bill, index) => {
                if (!bill.billReference || !bill.amount || !bill.period) {
                    console.error(`Row ${index + 1} is missing data:`, bill.raw);
                }
            });

            // Reformat bills after logging errors
            const finalBills = formattedBills.map(b => ({
                billReference: b.billReference?.toString().trim(),
                customerName: b.customerName?.toString().trim() || 'N/A',
                amount: parseFloat(b.amount),
                period: b.period?.toString().trim()
            }));

            if (finalBills.some(b => isNaN(b.amount))) {
                throw new Error('Invalid amount found in CSV. Please ensure all amounts are numbers.');
            }

            const result = await ingestUseCase.execute(finalBills, billerId, user);
            return ApiResponse.success(result, 'CSV processed successfully');
        }
        catch (e: any) {
            return reply.status(400).send(ApiResponse.error(e.message));
        }
    });

    fastify.get('/billers/:billerId/stats', { preHandler: authenticate }, async (request, reply) => {
        try {
            const { billerId } = request.params as any;
            const user = (request as any).user;

            const stats = await statsUseCase.execute(billerId, user);

            return ApiResponse.success(stats, 'Biller financial insights retrieved');
        } catch (e: any) {
            return reply.status(403).send(ApiResponse.error(e.message));
        }
    });

    fastify.get('/billers', { preHandler: authenticate }, async (request, reply) => {
        try {
            const billers = await prisma.biller.findMany({
                orderBy: {
                    createdAt: 'desc'
                }
            });

            return reply.send({
                status: 'SUCCESS',
                message: 'Billers retrieved successfull',
                data: billers
            });
        } catch (error) {
            return reply.status(5000).send({
                status: 'ERROR',
                message: 'Failed to fetch billers'
            });
        }
    })
}