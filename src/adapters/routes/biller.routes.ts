import { FastifyInstance } from "fastify";
import { CreateBillerUseCase } from "../../application/use-cases/biller/CreateBillerUseCase";
import { PrismaBillerRepository } from "../../infrastructure/repositories/PrismaBillerRepository";
import { IngestBillUseCase } from "../../application/use-cases/biller/IngestBillUseCase";
import { PrismaBillRepository } from "../../infrastructure/repositories/PrismaBillRepository";
import { authenticate } from "../hooks/auth.hook";
import { CreateBillerSchema, UpdateBillerSchema } from "../../shared/validators/biller.validator";
import { IngestBillSchema } from "../../shared/validators/biller.validator";
import { parseCsv } from "../../shared/utils/csvParser";
import { ApiResponse } from "../../shared/utils/ApiResponse";
import { GetBillerStatsUseCase } from "../../application/use-cases/biller/GetBillerStatusUseCase";
import { prisma } from "../../infrastructure/database/prisma";
import { CreateAuditLogUseCase } from "../../application/use-cases/admin/CreateAuditLogUseCase";
import { PrismaAuditRepository } from "../../infrastructure/repositories/PrismaAuditRepository";
import { GetBillerBillsUseCase } from "../../application/use-cases/biller/GetBillerBillsUseCase";
import { request } from "node:http";
import { GetBillerReportUseCase } from "../../application/use-cases/biller/GetBillerReportUseCase";
import { GetBillerDashboardStatsUseCase } from "../../application/use-cases/biller/GetBillerDashboardStatsUseCase";
    
const billRepo = new PrismaBillRepository();
const billerRepo = new PrismaBillerRepository();
const auditRepo = new PrismaAuditRepository();
const createBillerUC = new CreateBillerUseCase(billerRepo);
const createAuditUseCase = new CreateAuditLogUseCase(auditRepo);
const ingestUseCase = new IngestBillUseCase(billRepo);
const statsUseCase = new GetBillerStatsUseCase(billRepo);
const getBillerBillUseCase = new GetBillerBillsUseCase(billRepo);
const getBillerReportUseCase = new GetBillerReportUseCase(billRepo);
const getBillerDashboardStatsUseCase = new GetBillerDashboardStatsUseCase(billRepo);

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

      await createAuditUseCase.execute({
        userId: (request as any).user.id,
        userEmail: (request as any).user.email,
        action: "CREATE",
        entityName: "Biller",
        entityId: biller.id,
        newValues: {
          name: biller.name,
          code: biller.code,
          category: biller.category,
        },
        ipAddress: request.ip,
        userAgent: request.headers["user-agent"],
        status: "SUCCESS",
      });
      return {
        status: "SUCCESS",
        message: "Biller registered successfully",
        data: biller,
      };
    },
  );

  fastify.post(
    "/billers/:billerId/bills",
    { preHandler: authenticate },
    async (request, reply) => {
      try {
        const { billerId } = request.params as any;
        const user = (request as any).user;
        const validateBills = IngestBillSchema.parse(request.body);
        const result = await ingestUseCase.execute(
          validateBills,
          billerId,
          user,
        );
        return { status: "SUCCESS", ...result };
      } catch (e: any) {
        if (e.name === "ZodError") {
          return reply.status(400).send({
            status: "VALIDATION_ERROR",
            errors: e.errors.map((err: any) => ({
              field: err.path.join("."),
              message: err.message,
            })),
          });
        }
        return reply.status(500).send({ status: "FAILED", message: e.message });
      }
    },
  );

  fastify.post(
    "/billers/upload-bills",
    { preHandler: authenticate },
    async (request, reply) => {
      try {
        const user = (request as any).user;
        let targetBillerId: string;

        if (user.role === "SYSTEM_ADMIN") {
          targetBillerId = (request.query as any).billerId;
          if (!targetBillerId) {
            return reply
              .status(400)
              .send(
                ApiResponse.error(
                  "System Admin must provide a billerId in query parameters (e.g., ?billerId=YOUR_BILLER_UUID)",
                ),
              );
          }
        } else if (user.role === "BILLER_USER") {
          targetBillerId = user.billerId;
          if (!targetBillerId) {
            return reply
              .status(400)
              .send(
                ApiResponse.error(
                  "Your Biller Admin account is not associated with any Biller. Please contact support.",
                ),
              );
          }
        } else {
          return reply
            .status(403)
            .send(
              ApiResponse.error(
                "Forbidden: Only Biller Admins or System Admins can upload bills.",
              ),
            );
        }

        const data = await request.file();
        if (!data) throw new Error("No CSV file uploaded");

        const fileBuffer = await data.toBuffer();
        const rawBills = await parseCsv(fileBuffer); // Assuming parseCsv exists

        const formattedBills = rawBills.map((b) => {
          const billReference =
            b.billReference ||
            b.billReference ||
            b.customerReference ||
            b.reference;
          const amount = b.amount || b.Amount || b.Value;
          const period = b.period || b.Period || b.Month;
          const customerName = b.customerName || b.Customer || b.Name;
          return {
            billReference: billReference?.toString().trim(),
            amount: amount,
            period: period?.toString().trim(),
            customerName: customerName?.toString().trim(),
            raw: b,
          };
        });

        formattedBills.forEach((bill, index) => {
          if (!bill.billReference || !bill.amount || !bill.period) {
            console.error(`Row ${index + 1} is missing data:`, bill.raw);
          }
        });

        const finalBills = formattedBills.map((b) => ({
          billReference: b.billReference?.toString().trim(),
          customerName: b.customerName?.toString().trim() || "N/A",
          amount: parseFloat(b.amount),
          period: b.period?.toString().trim(),
        }));

        if (finalBills.some((b) => isNaN(b.amount))) {
          throw new Error(
            "Invalid amount found in CSV. Please ensure all amounts are numbers.",
          );
        }

        const result = await ingestUseCase.execute(
          finalBills,
          targetBillerId,
          user,
        ); //

        await createAuditUseCase.execute({
          userId: user.id,
          userEmail: user.email,
          action: "BATCH_BILL_UPLOAD",
          entityName: "Bill",
          entityId: targetBillerId,
          newValues: {
            totalProcessed: result.total,
            successCount: result.success,
            failedCount: result.failed,
          },
          ipAddress: request.ip,
          status: "SUCCESS",
        });

        return ApiResponse.success(result, "CSV processed successfully");
      } catch (e: any) {
        await createAuditUseCase.execute({
          userId: (request as any).user?.id,
          userEmail: (request as any).user?.email,
          action: "BATCH_BILL_UPLOAD_FAILED",
          entityName: "Biller",
          entityId: "N/A",
          newValues: {
            error: e.message,
            attemptedByRole: (request as any).user?.role,
          },
          ipAddress: request.ip,
          status: "FAILED",
        });
        return reply.status(400).send(ApiResponse.error(e.message));
      }
    },
  );

  fastify.get(
    "/stats",
    { preHandler: [authenticate] },
    async (request, reply) => {
      const user = (request as any).user;
      const stats = await getBillerDashboardStatsUseCase.execute(user.billerId);
      return { status: "SUCCESS", data: stats };
    },
  );


  fastify.get(
    "/billers",
    { preHandler: authenticate },
    async (request, reply) => {
      try {
        // Default pagination values
        const page = 1;
        const limit = 100;
        const billers = await billerRepo.findAll({
          page,
          limit,
        });

        return reply.send({
          status: "SUCCESS",
          message: "Billers retrieved successfull",
          data: billers,
        });
      } catch (error) {
        return reply.status(500).send({
          status: "ERROR",
          message: "Failed to fetch billers",
        });
      }
    },
  );

  
  fastify.get(
    "/bills",
    { preHandler: [authenticate] },
    async (request, reply) => {
      const user = (request as any).user;
      const bills = await billRepo.findByBillerId(user.billerId);

      const formattedData = bills.map((b) => {
        const due = Number(b.amount || 0);
          let paid = Number(b.amountPaid || 0);  
          if (b.status === 'PAID') {
              paid = due;
          }
        return {
          id: b.id,
          bill_reference: b.billReference,
          customer_name: b.customerName,
          period: b.period,
          amount_due: due,
          amount_paid: paid,
          remaining_bal: due - paid, 
          status: b.status,
          createdAt: b.createdAt,
        };
      });

      return { status: "SUCCESS", data: formattedData };
    },
  );

  fastify.get(
    "/report",
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { fromDate, toDate } = request.query as any;
      const user = (request as any).user;

      const result = await getBillerReportUseCase.execute(
        user.billerId,
        fromDate,
        toDate,
      );
      return { status: "SUCCESS", data: result };
    },
  );
  fastify.put('/billers/:id', { preHandler: [authenticate] }, async (request, reply) => {
    try {
      const { id } = request.params as any;
      const validatedData = UpdateBillerSchema.parse(request.body);
      

      const biller = await billerRepo.update(id, validatedData);
      await createAuditUseCase.execute({
        userId: (request as any).user.id,
        userEmail: (request as any).user.email,
        action: "UPDATE",
        entityName: "Biller",
        entityId: id,
        newValues: validatedData,
        ipAddress: request.ip,
        status: "SUCCESS",
      });
      return { status: "SUCCESS", data: biller }
    } catch (e: any) {
      return reply.status(500).send({ status: 'FAILED', message: e.message });
    }
  });

  fastify.delete("/billers/:id", { preHandler: [authenticate] }, async (request, reply) => {
    try {
      const { id } = request.params as any;

      await billerRepo.delete(id);

      await createAuditUseCase.execute({
        userId: (request as any).user.id,
        userEmail: (request as any).user.email,
        action: "DELETE",
        entityName: "Biller",
        entityId: id,
        newValues: {},
        ipAddress: request.ip,
        status: "SUCCESS",
      });
return {status: "SUCCESS", message: "Biller deleted successfully" }
    } catch (e: any) {
      return reply.status(500).send({ status: 'FAILED', message: e.message });
    }
  })
}