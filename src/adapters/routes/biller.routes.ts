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
      const user = (request as any).user;

      try {
        let targetBillerId: string;

        if (user.role === "SYSTEM_ADMIN") {
          targetBillerId = (request.query as any).billerId;

          if (!targetBillerId) {
            return reply
              .status(400)
              .send(
                ApiResponse.error(
                  "System Admin must provide a billerId in query parameters",
                ),
              );
          }

          const biller = await billerRepo.findById(targetBillerId);
          if (!biller) {
            return reply
              .status(404)
              .send(ApiResponse.error("Biller not found"));
          }
        } else if (user.role === "BILLER_USER") {
          targetBillerId = user.billerId;

          if (!targetBillerId) {
            return reply
              .status(400)
              .send(
                ApiResponse.error(
                  "Your account is not associated with any Biller. Contact support.",
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

        const file = await request.file();
        if (!file) {
          throw new Error("No CSV file uploaded");
        }

        // ... (Inside the route after parseCsv)
        const buffer = await file.toBuffer();
        const rawBills = await parseCsv(buffer);

        const validationErrors: string[] = [];
        const finalBills: any[] = [];

        rawBills.forEach((b: any, index: number) => {
          const rowNumber = index + 2; // Header is 1, data starts at 2

          // 🛡️ 1. Extract and Normalize
          const billReference = (
            b.billReference ||
            b.customerReference ||
            b.reference ||
            b.BillRef
          )
            ?.toString()
            .trim();
          const amountRaw = b.amount || b.Amount || b.Value || b.Total;
          const period = (b.period || b.Period || b.Month)?.toString().trim();
          const customerName =
            (b.customerName || b.Customer || b.Name)?.toString().trim() ||
            "N/A";
          const dueDateRaw = b.due_date || b.DueDate || b.Due_Date || b.Expiry;

          // 🛡️ 2. Validation Logic
          const rowErrors: string[] = [];
          if (!billReference) rowErrors.push("Missing Reference");
          if (!period) rowErrors.push("Missing Period");
          if (!dueDateRaw) rowErrors.push("Missing Due Date"); // 🚀 Mandatory!

          const amount = parseFloat(
            amountRaw?.toString().replace(/[^0-9.-]+/g, ""),
          );
          if (isNaN(amount)) rowErrors.push("Invalid Amount");

          const parsedDate = new Date(dueDateRaw);
          if (isNaN(parsedDate.getTime()))
            rowErrors.push("Invalid Date Format");

          // 🛡️ 3. Collect Errors or Build Bill
          if (rowErrors.length > 0) {
            validationErrors.push(`Row ${rowNumber}: ${rowErrors.join(", ")}`);
          } else {
            finalBills.push({
              billReference,
              customerName,
              amount,
              period,
              dueDate: parsedDate, // 🚀 Now a real Date object
            });
          }
        });

        // 🚨 4. If ANY errors, STOP and return the list
        if (validationErrors.length > 0) {
          const errorMessage = `FILE VALIDATION FAILED:\n${validationErrors.slice(0, 10).join("\n")}${validationErrors.length > 10 ? "\n...and more" : ""}`;
          return reply.status(400).send(ApiResponse.error(errorMessage));
        }


        const result = await ingestUseCase.execute(
          finalBills,
          targetBillerId,
          user,
        );

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

        return reply.send(
          ApiResponse.success(result, "CSV processed successfully"),
        );
      } catch (e: any) {
        
        await createAuditUseCase.execute({
          userId: user?.id,
          userEmail: user?.email,
          action: "BATCH_BILL_UPLOAD_FAILED",
          entityName: "Bill",
          entityId: "N/A",
          newValues: {
            error: e.message,
            attemptedByRole: user?.role,
          },
          ipAddress: request.ip,
          status: "FAILED",
        });

        
        
        const statusCode =
          e.message?.includes("invalid") || e.message?.includes("CSV")
            ? 400
            : 500;

        return reply.status(statusCode).send(ApiResponse.error(e.message));
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