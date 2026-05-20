import { FastifyInstance } from "fastify";
import { CreateBillerUseCase } from "../services/biller/CreateBillerUseCase";
import { PrismaBillerRepository } from "../models/PrismaBillerRepository";
import { IngestBillUseCase } from "../services/biller/IngestBillUseCase";
import { PrismaBillRepository } from "../models/PrismaBillRepository";
import { authenticate } from "../hooks/auth.hook";
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
                  "System Admin must provide a billerId",
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

        const data = await request.file();
              if (!data) {
                return reply
                  .status(400)
                  .send(ApiResponse.error("No CSV uploaded"));
              }


        // UI FALLBACK VALUES
      
        const uiPeriod = (data.fields.period as any)?.value?.toString().trim();
        const uiDueDateRaw = (data.fields.dueDate as any)?.value?.toString().trim();
        const uiDueDate = uiDueDateRaw ? new Date(uiDueDateRaw) : null;

        const buffer = await data.toBuffer();
        const rawBills = await parseCsv(buffer);

        const validationErrors: string[] = [];
        const finalBills: any[] = [];

        rawBills.forEach((b: any, index: number) => {
          const rowNumber = index + 2; 
          const rowErrors: string[] = [];

          //  1. Extract and Normalize
          const billReference = (
            b.billReference ||
            b.customerReference ||
            b.reference ||
            b.BillRef
          )
            ?.toString()
            .trim();
          const amountRaw = b.amount || b.Amount || b.Value || b.Total;
          const csvPeriod = (b.period || b.Period || b.Month)?.toString().trim();
          const csvDueDateRaw = b.due_date || b.DueDate || b.Due_Date || b.Expiry;
          const customerName =
            (b.customerName || b.Customer || b.Name)?.toString().trim() || null;
          

          const finalPeriod = csvPeriod || uiPeriod;

          // Use CSV data if it exists , otherwise use UI fallback
          let finalDueDate: Date | null = null;
          if (csvDueDateRaw) {
            finalDueDate = new Date(csvDueDateRaw)
          } else if (uiDueDate) {
            finalDueDate = uiDueDate;
          }

          if (!billReference) rowErrors.push("Missing Reference");
          const amount = parseFloat(
            amountRaw?.toString().replace(/[^0-9.-]+/g, ""),
          );
          if (isNaN(amount)) rowErrors.push("Invalid Amount");
           if (amount <= 0) rowErrors.push("Amount must be greater than zero");

          if (!finalPeriod) {
            rowErrors.push("Missing Period (CSV or UI required)");
          }
          if (!finalDueDate || isNaN(finalDueDate.getTime())) {
            rowErrors.push('Missing or Invalid Due Date(Required in CSV or UI');
          }

          //  3. Collect Errors or Build Bill
          if (rowErrors.length > 0) {
            validationErrors.push(`Row ${rowNumber}: ${rowErrors.join(", ")}`);
          } else {
            finalBills.push({
              billReference,
              customerName,
              amount,
              period: finalPeriod,
              dueDate: finalDueDate,
              billerId: targetBillerId,
              status: "UNPAID",
              currency: "ETB",
            });
          }
        });

        //  4. If ANY errors, STOP and return the list
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