import { FastifyInstance } from "fastify";
import { authenticateSession} from "../hooks/auth.hook";
import { LookupBillUseCase } from "../services/agent/LooupBillUseCase";
import { prisma } from '../config/prisma'


const lookUpBillUseCase = new LookupBillUseCase(prisma);

export async function billRoutes(fastify: FastifyInstance) {
  fastify.get(
    "/bills/lookup",
    { preHandler: [authenticateSession] },
    async (request, reply) => {
      const { billReference } = request.query as {
        billReference: string;
      };

      if (!billReference) {
        return reply.status(400).send({
          status: "FAILED",
          message: "bill Reference is required for lookup",
        });
      }
      try {
        const bill = await lookUpBillUseCase.execute(billReference);
        return { status: "SUCCESS", data: bill };
      } catch (e: any) {
        return reply.status(404).send({
          status: "NOT_FOUND",
          message: e.message,
        });
      }
    },
  );
  // DELETE /bills/:id - Soft delete a bill
  fastify.delete(
    "/bills/:id",
    { preHandler: [authenticateSession] },
    async (request, reply) => {
      const { id } = request.params as { id: string };

      try {
        const deletedBill = await prisma.bill.update({
          where: { id },
          data: {
            isDeleted: true,
            deletedAt: new Date(),
          },
        });

        return {
          status: "SUCCESS",
          message: "Bill moved to trash",
          data: deletedBill,
        };
      } catch (e: any) {
        return reply.status(500).send({
          status: "FAILED",
          message: "Could not delete bill: " + e.message,
        });
      }
    },
  );

  // DELETE /bills/all - Soft delete ALL bills for the authenticated Biller
  fastify.delete(
    "/bills/all",
    { preHandler: [authenticateSession] },
    async (request, reply) => {
      // Access the user data attached by your hook
      const user = (request as any).user;

      if (!user || !user.billerId) {
        return reply.status(403).send({
          status: "FORBIDDEN",
          message: "You do not have a valid Biller account context.",
        });
      }

      try {
        const result = await prisma.bill.updateMany({
          where: {
            billerId: user.billerId, // Pulled securely from session, not user input
            isDeleted: false,
          },
          data: {
            isDeleted: true,
            deletedAt: new Date(),
          },
        });

        return {
          status: "SUCCESS",
          message: `Successfully moved ${result.count} bills to trash.`,
        };
      } catch (e: any) {
        return reply.status(500).send({
          status: "FAILED",
          message: "Could not delete bills: " + e.message,
        });
      }
    },
  );
}