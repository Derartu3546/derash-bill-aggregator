import { FastifyReply, FastifyRequest } from "fastify";
import { UpdateSettingsUseCase } from "../services/user/UpdateSettingsUseCase";
import { PrismaUserRepository } from "../models/PrismaUserRepository";
import { PrismaAuditRepository } from "../models/PrismaAuditRepository";
import { updateSettingsSchema } from "../shared/validators/userSetting.validator";

const userRepo = new PrismaUserRepository();
const auditRepo = new PrismaAuditRepository()
const updateSettingsUseCase = new UpdateSettingsUseCase(userRepo, auditRepo);


export const updateUserSettings = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const userId = (request.user as any).id;
  const email = (request.user as any).email;
    const body = request.body;
    
    const validateData = updateSettingsSchema.parse(request.body);

  const result = await updateSettingsUseCase.execute(userId, validateData, {
    ip: request.ip,
    email,
  });

  return reply.send({
    status: "SUCCESS",
    message: "Settings updated perfectly.",
    data: result,
  });
};
