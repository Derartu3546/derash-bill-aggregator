import { FastifyInstance } from "fastify";
import { BillController } from "../controllers/agent/BillController";
import { auditLogger } from "../middleware/auditMiddleware";
import { validateApiKey } from "../middleware/authMiddleware";
import { validateAdminKey } from "../middleware/adminAuthMiddleware";
import { AdminDataController } from "../controllers/admin/AdminDataController";

import crypto from "crypto";
import { authenticate } from "../middleware/auth.hook";
import { PrismaAuditRepository } from "../models/PrismaAuditRepository";
import { CreateAuditLogUseCase } from "../services/admin/CreateAuditLogUseCase";
import { RegisterUserUseCase } from "../services/auth/RegisterUserUseCase";
import { PrismaUserRepository } from "../models/PrismaUserRepository";
import { PrismaAdminRepository } from "../models/PrismaAdminRepository";
import { GetAllUsersUseCase } from "../services/admin/GetAllUsersUseCase";

const adminRepo = new PrismaAdminRepository();
const userRespo = new PrismaUserRepository();
const registerUseCase = new RegisterUserUseCase(userRespo);
const auditRepo = new PrismaAuditRepository();
const createAuditUseCase = new CreateAuditLogUseCase(auditRepo);
const getAllUsersUseCase = new GetAllUsersUseCase(userRespo);


const billController = new BillController();

// --- ROUTES FOR AGENTS ---
export async function agentRoutes(fastify: FastifyInstance) {
  fastify.addHook("preHandler", validateApiKey); 
  fastify.addHook("preHandler", auditLogger);

  fastify.get("/dashboard", billController.getDashboard);
  fastify.get("/bill-inquiry/:reference", billController.getBillInfo);
  fastify.post("/confirm-payment", billController.processPayment);

  fastify.get("/my-report", billController.getAgentReport);
}

// --- ROUTES FOR DERASH ADMINS ---
export async function adminRoutes(fastify: FastifyInstance) {
  const adminDataController = new AdminDataController();

  fastify.addHook("preHandler", validateAdminKey);
  fastify.addHook("preHandler", auditLogger);

  fastify.get("/global-report", adminDataController.getAdminReport);

  fastify.get("/users", adminDataController.getUsers);
  fastify.get("/agents", adminDataController.getAgents);
  fastify.get("/billers", adminDataController.getBillers);
  fastify.get(
    "/logs",
    { preHandler: [authenticate] },
    async (request, reply) => {
      if ((request as any).user.role !== "SYSTEM_ADMIN") {
        return reply
          .status(403)
          .send({ message: "Access Denied: Only Admins can View logs" });
      }
      const logs = await auditRepo.findAll();
      return { status: "SUCCESS", data: logs };
    },
  );
  fastify.post(
    "/users",
    { preHandler: [authenticate] },
    async (request, reply) => {
      const requester = (request as any).user;

      if (requester.role !== "SYSTEM_ADMIN") {
        return reply
          .status(403)
          .send({ message: "Only Derash Admins can create users" });
      }

      const { email, password, fullName, role, billerId, agentId } =
        request.body as any;
      if (role === "BILLER_USER" && !billerId) {
        return reply
          .status(400)
          .send({ message: "Biller ID is required for for BILLER_USER" });
      }
      if (role === "AGENT_USER" && !agentId) {
        return reply
          .status(400)
          .send({ message: "Agent ID is required for AGENT_USER" });
      }
      try {
        const tempPassword =
          (request.body as any).password ||
          Math.random().toString(36).slice(-10);
        const newUser = await registerUseCase.execute({
          fullName,
          email,
          password: tempPassword,
          role,
          billerId,
          agentId,
        });
        await createAuditUseCase.execute({
          userId: requester.id,
          userEmail: requester.email,
          action: "CREATE_USER",
          entityName: "User",
          entityId: newUser.id,
          newValues: { email, role, billerId, agentId },
          status: "SUCCESS",
          ipAddress: request.ip,
        });
        return {
          status: "SUCCESS",
          data: {
            id: newUser.id,
            email: newUser.email,
            fullName: newUser.fullName,
            role: newUser.role,
            temporaryPassword: tempPassword,
          },
          message:
            "User created successfully. Provide the temporary password to the user.",
        };
      } catch (e: any) {
        return reply.status(400).send({ status: "FAILED", message: e.message });
      }
    },
  );

  fastify.get(
    "/stats",
    { preHandler: [authenticate] },
    async (request, reply) => {
      const user = (request as any).user;

      //
      if (user.role !== "SYSTEM_ADMIN") {
        return reply.status(403).send({ message: "Access Denied" });
      }

      const stats = await adminRepo.getGlobalStats();
      return { status: "SUCCESS", data: stats };
    },
  );
  fastify.get(
    "/user",
    { preHandler: [authenticate] },
    async (request, reply) => {
      const requester = (request as any).user;

      if (requester.role !== "SYSTEM_ADMIN") {
        return reply
          .status(403)
          .send({ message: "Only Derash Admins can create users Denied" });
      }
      try {
        const users = await getAllUsersUseCase.execute();
        return { status: "SUCCESS", data: users };
      } catch (e) {
        return reply.status(500).send({ message: "Failed to fetch users" });
      }
    },
  );

  fastify.put(
    "/users/:id",
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { id } = request.params as any;
      const updatedData = request.body as any;
      const updateUser = await userRespo.update(id, updatedData);
      return { staus: "SUCCESS", data: updateUser };
    },
  );

  fastify.delete(
    "/users/:id",
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { id } = request.params as any;
      const requester = (request as any).user;

      if (requester.role !== "SYSTEM_ADMIN") {
        return reply.status(403).send({
          status: "FAILED",
          message: "Only SYSTEM_ADMIN can delete users",
        });
      }

      if (requester.id === id) {
        return reply.status(400).send({
          status: "FAILED",
          message: "You cannot delete your own account while logged in!",
        });
      }

      // await userRespo.delete(id);

      await userRespo.delete(id, {});

      return { status: "SUCCESS", message: "User deleted" };
    },
  );

  fastify.patch(
    "/users/:id/toggle-status",
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { id } = request.params as any;
      const requester = (request as any).user;
      if (requester.role !== "SYSTEM_ADMIN") {
        return reply.status(403).send({
          message: "Access Denied: Only SYSTEM_ADMIN can disable users.",
        });
      }

      try {
        const user = await userRespo.findById(id);
        if (!user) {
          return reply.status(404).send({ message: "User not found" });
        }

        if (user.role === "SYSTEM_ADMIN" && user.id === requester.id) {
          return reply
            .status(403)
            .send({ message: "Cannot disable your own SYSTEM_ADMIN account." });
        }

        const newStatus = user.status === "active" ? "disabled" : "active";
        const updatedUser = await userRespo.update(id, { status: newStatus });

        await createAuditUseCase.execute({
          userId: requester.id,
          action: "TOGGLE_USER_STATUS",
          entityName: "User",
          entityId: id,
          newValues: { status: newStatus },
          ipAddress: request.ip,
        });

        return { status: "SUCCESS", data: updatedUser };
      } catch (e: any) {
        console.error("Error toggling user status:", e);
        return reply
          .status(500)
          .send({ message: "Failed to update user status." });
      }
    },
  );

  fastify.post(
    "/users/:id/reset-password",
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { id } = request.params as any;
      const requester = (request as any).user;

      if (requester.role !== "SYSTEM_ADMIN") {
        return reply.status(403).send({ message: "Unauthorized" });
      }

      const resetToken = crypto.randomBytes(4).toString("hex").toUpperCase();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      await userRespo.updateResetToken(id, resetToken, expiresAt);

      await createAuditUseCase.execute({
        userId: requester.id,
        action: "ADMIN_INITIATED_PASSWORD_RESET",
        entityName: "User",
        entityId: id,
        status: "SUCCESS",
      });
      return {
        status: "SUCCESS",
        data: { resetToken },
        message: "Give this token to the user. It expires in 1 hour.",
      };
    },
  );

}


