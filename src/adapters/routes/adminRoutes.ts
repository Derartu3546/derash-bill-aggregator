import fastify, { FastifyInstance } from "fastify";
import { authenticate } from "../hooks/auth.hook";
import { PrismaAuditRepository } from "../../infrastructure/repositories/PrismaAuditRepository";
import { CreateAuditLogUseCase } from "../../application/use-cases/admin/CreateAuditLogUseCase";
import { RegisterUserUseCase } from "../../application/use-cases/auth/RegisterUserUseCase";
import { PrismaUserRepository } from "../../infrastructure/repositories/PrismaUserRepository";
import { PrismaAdminRepository } from "../../infrastructure/repositories/PrismaAdminRepository";
import { GetAllUsersUseCase } from "../../application/use-cases/admin/GetAllUsersUseCase";

const adminRepo = new PrismaAdminRepository();
const userRespo = new PrismaUserRepository();
const registerUseCase = new RegisterUserUseCase(userRespo);
const auditRepo = new PrismaAuditRepository();
const createAuditUseCase = new CreateAuditLogUseCase(auditRepo);
const getAllUsersUseCase = new GetAllUsersUseCase(userRespo);

export async function adminRoutes(fastify: FastifyInstance) {
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
          .send({ message: "Only Admins can create users" });
      }

      const { email, password, fullName, role, billerId, agentId } =
        request.body as any;
      if (role === "BILLER_USER" && !billerId) {
        return reply
          .status(400)
          .send({ message: "agent ID is required for AGENT_USER" });
      }
      try {
        const newUser = await registerUseCase.execute({
          fullName,
          email,
          password,
          role,
          billerId,
          agentId,
        });
        return { status: "SUCCESS", data: newUser };
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
    "/users",
    { preHandler: [authenticate] },
    async (request, reply) => {
      const requester = (request as any).user;

      if (requester.role !== "SYSTEM_ADMIN") {
        return reply.status(403).send({ message: "Access Denied" });
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
      await userRespo.delete(id);
      return { status: "SUCCESS", message: "User deleted" };
    },
  );

  // In src/infrastructure/web/routes/adminRoutes.ts

  fastify.patch(
    "/users/:id/toggle-status",
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { id } = request.params as any;
      const requester = (request as any).user;
      if (requester.role !== "SYSTEM_ADMIN") {
        return reply
          .status(403)
          .send({
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

        return { status: "SUCCESS", data: updatedUser };
      } catch (e: any) {
        console.error("Error toggling user status:", e); 
        return reply
          .status(500)
          .send({ message: "Failed to update user status." });
      }
    },
  );
}

