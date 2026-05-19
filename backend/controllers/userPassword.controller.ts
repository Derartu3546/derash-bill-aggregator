import { FastifyReply, FastifyRequest } from "fastify";
import { UpdatePasswordUseCase } from "../services/auth/UpdatePasswordUseCase";
import { updatePasswordSchema } from "../shared/validators/password.validator";
import { ApiResponse } from "../shared/utils/ApiResponse";
import { AuditService } from "../services/AuditService";

const updatePasswordUseCase = new UpdatePasswordUseCase();

export const updatePasswordFromSettingsHandler = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  try {
    const user = request.user as any;

    const userId = user.id;
    const email = user.email;
    const ip = request.ip;
    const userAgent = request.headers["user-agent"];

    // Validate request body
    const validatedData = updatePasswordSchema.parse(request.body);

    await updatePasswordUseCase.execute(userId, email, validatedData, {
      ip,
      userAgent,
    });

    await AuditService.log({
      userId,
      userEmail: email,
      action: "PASSWORD_UPDATE",
      entity: "User",
      entityId: userId,
      ip,
      newData: { status: "Success" },
    });

    return reply.send(
      ApiResponse.success(null, "Password updated successfully."),
    );
  } catch (err: any) {
    if (err.message === "INVALID_CURRENT_PASSWORD") {
      return reply.status(400).send({
        status: "FAIL",
        message: "The current password you entered is incorrect.",
      });
    }

    if (err.message === "SAME_PASSWORD") {
      return reply.status(400).send({
        status: "FAIL",
        message: "New password cannot be the same as your old password.",
      });
    }

    if (err.message === "USER_NOT_FOUND") {
      return reply.status(401).send({
        status: "FAIL",
        message: "Session invalid.",
      });
    }

    if (err.name === "ZodError") {
      return reply.status(400).send({
        status: "FAIL",
        message: "Validation failed",
        errors: err.errors,
      });
    }

    console.error("Password Update Error:", err);

    return reply.status(500).send({
      status: "ERROR",
      message: "An internal server error occurred.",
    });
  }
};
