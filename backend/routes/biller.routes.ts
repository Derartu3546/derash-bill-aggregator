import { FastifyInstance } from "fastify";
import fs from 'fs';
import path from 'path';
import { pipeline } from "stream/promises";
import { parseFile } from "../shared/utils/fileParser";
import { CreateBillerUseCase } from "../services/biller/CreateBillerUseCase";
import { PrismaBillerRepository } from "../models/PrismaBillerRepository";
import { IngestBillUseCase } from "../services/biller/IngestBillUseCase";
import { PrismaBillRepository } from "../models/PrismaBillRepository";
import { authenticateSession } from "../hooks/auth.hook";
import { CreateBillerSchema, UpdateBillerSchema } from "../shared/validators/biller.validator"; 
import { IngestBillSchema } from "../shared/validators/biller.validator";
import { parseCsv } from "../shared/utils/csvParser";
import { ApiResponse } from "../shared/utils/ApiResponse";
import { GetBillerStatsUseCase } from "../services/biller/GetBillerStatusUseCase";
import { prisma } from '../config/prisma';
import { CreateAuditLogUseCase } from "../services/admin/CreateAuditLogUseCase";
import { PrismaAuditRepository } from "../models/PrismaAuditRepository";
import { GetBillerBillsUseCase } from "../services/biller/GetBillerBillsUseCase";
import { GetBillerReportUseCase } from "../services/biller/GetBillerReportUseCase";
import { GetBillerDashboardStatsUseCase } from "../services/biller/GetBillerDashboardStatsUseCase";
import { Bill } from "@prisma/client";
import { CsvMapper } from "../shared/utils/CsvMapper";

    
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
    { preHandler: authenticateSession },
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
    { preHandler: authenticateSession },
    async (request, reply) => {
      try {
        const { billerId } = request.params as any;
        const user = (request as any).user;
        const validateBills = IngestBillSchema.parse(request.body);

        const normalizedBills = validateBills.map((b: any) => ({
          billReference: b.billReference,
          customerName: b.customerName || "N/A",
          amount: Number(b.amount),
          period: b.period,
          dueDate: new Date(b.due_date || b.dueDate),
        }));
        const result = await ingestUseCase.execute(
          normalizedBills,
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
    {
      preHandler: authenticateSession,
      validatorCompiler: () => () => true,
      schema: {
        description:
          "Upload a CSV file containing bills. Allows Fallback values for missing CSV columns .",
        tags: ["Biller"],
        consumes: ["multipart/form-data"],
        // 1. Documentation for the Admin query param
        querystring: {
          type: "object",
          properties: {
            billerId: {
              type: "string",
              description: "Required only for System Admins",
            },
          },
        },
        // 2 Documentation for the Multipart Form
        body: {
          type: "object",
          properties: {
            file: {
              type: "string",
              format: "binary",
              description: "The CSV file to upload",
            },
            period: {
              type: "string",
              description: "Fallback period (e.g., 2024-May)",
            },
            dueDate: {
              type: "string",
              format: "date",
              description: "Fallback due date",
            },
          },
        },
        // 3 .Response Documentation
        response: {
          200: {
            type: "object",
            properties: {
              status: { type: "string" },
              message: { type: "string" },
              data: {
                type: "object",
                properties: {
                  total: { type: "integer" },
                  success: { type: "integer" },
                  failed: { type: "integer" },
                  duplicates: { type: "integer" },
                },
              },
            },
          },
          400: {
            type: "object",
            properties: {
              status: { type: "string" },
              message: { type: "string" },
            },
          },
          403: {
            type: "object",
            properties: {
              status: { type: "string" },
              message: { type: "string" },
            },
          },
          404: {
            type: "object",
            properties: {
              status: { type: "string" },
              message: { type: "string" },
            },
          },
          500: {
            type: "object",
            properties: {
              status: { type: "string" },
              message: { type: "string" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const user = (request as any).user;
      let filePath: string | undefined;

      try {
        let targetBillerId: string;

        if (user.role === "SYSTEM_ADMIN") {
          targetBillerId = (request.query as any).billerId;

          if (!targetBillerId) {
            return reply
              .status(400)
              .send(ApiResponse.error("System Admin must provide a billerId"));
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

        const data = await request.file();
        if (!data) {
          return reply.status(400).send(ApiResponse.error("No file uploaded"));
        }

        // 1 Save file to a temporary location 
        const tempDir = path.join(__dirname, "../../uploads/temp");
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
        const filePath = path.join(tempDir, `${Date.now()}-${data.filename}`);

        await pipeline(data.file, fs.createWriteStream(filePath));

        const rawBills = await parseFile(filePath);
const validationErrors: string[] = [];
const finalBills: any[] = [];
        // UI FALLBACK VALUES

        const uiPeriod = (data.fields.period as any)?.value?.toString().trim();
        const uiDueDateRaw = (data.fields.dueDate as any)?.value
          ?.toString()
          .trim();
        const uiDueDate = uiDueDateRaw ? new Date(uiDueDateRaw) : null;

        rawBills.forEach((row: any, index: number) => {
          const { bill, errors } = CsvMapper.toBill(row, targetBillerId, {
            period: uiPeriod,
            dueDate: uiDueDate
          });
          if (errors.length > 0) {
            validationErrors.push(`Row ${index + 2}: ${errors.join(", ")}`);
          } else if (bill) {
            finalBills.push(bill);
          }
          });
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
      } finally {
        if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      }
    },
  );

  fastify.get(
    "/stats",
    { preHandler: [authenticateSession] },
    async (request, reply) => {
      const user = (request as any).user;
      const stats = await getBillerDashboardStatsUseCase.execute(user.billerId);
      return { status: "SUCCESS", data: stats };
    },
  );


  fastify.get(
    "/billers",
    { preHandler: [authenticateSession] },
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
    { preHandler: [authenticateSession] },
    async (request, reply) => {
      const user = (request as any).user;
      const bills = await billRepo.findByBillerId(user.billerId);

      const formattedData = bills.map((b:Bill) => {
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
    { preHandler: [authenticateSession] },
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
  fastify.put('/billers/:id', { preHandler: [authenticateSession] }, async (request, reply) => {
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

  fastify.delete("/billers/:id", { preHandler: [authenticateSession] }, async (request, reply) => {
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