import { FastifyReply, FastifyRequest } from "fastify";
import { UpdateSettingsUseCase } from "../services/user/UpdateSettingsUseCase";
import { PrismaUserRepository } from "../models/PrismaUserRepository";
import { PrismaAuditRepository } from "../models/PrismaAuditRepository";
import { updateSettingsSchema } from "../shared/validators/userSetting.validator";
import { GetSettingUseCase } from "../services/user/GetSettingsUseCase";
import { prisma } from "../config/prisma";
import { AuditService } from "../services/AuditService";

const userRepo = new PrismaUserRepository();
const auditRepo = new PrismaAuditRepository();

const updateSettingsUseCase = new UpdateSettingsUseCase(userRepo, auditRepo);

const getSettingsUseCase = new GetSettingUseCase(userRepo);

export const getUserSettingsHandler = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  try {
    const userId = (request.user as any).id;

    const settings = await getSettingsUseCase.execute(userId);

    return reply.status(200).send({
      status: "SUCCESS",
      data: settings,
    });
  } catch {
    return reply.status(500).send({
      status: "ERROR",
      message: "Could not retrieve user settings.",
    });
  }
};

export const updateUserSettings = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  try {
    const user = request.user as any;

    const userId = user.id;
    const email = user.email;

    const validatedData = updateSettingsSchema.parse(request.body);

    const oldSettings = await prisma.userSettings.findUnique({
      where: { userId },
    });

    const updated = await updateSettingsUseCase.execute(userId, validatedData, {
      ip: request.ip,
      email,
    });

    await AuditService.log({
      userId,
      userEmail: email,
      action: "SETTINGS_UPDATE",
      entity: "UserSettings",
      entityId: updated.id,
      oldData: oldSettings,
      newData: validatedData,
      ip: request.ip,
    });

    return reply.send({
      status: "SUCCESS",
      message: "Settings updated successfully.",
      data: updated,
    });
  } catch (err: any) {
    if (err.name === "ZodError") {
      return reply.status(400).send({
        status: "FAIL",
        message: "Validation failed",
        errors: err.errors,
      });
    }

    console.error("Settings Update Error:", err);

    return reply.status(500).send({
      status: "ERROR",
      message: "Failed to update settings.",
    });
  }
};
