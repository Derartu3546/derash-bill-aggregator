import { FastifyReply, FastifyRequest } from "fastify";
import { UpdatePasswordUseCase } from "../services/auth/UpdatePasswordUseCase";
import { upadtePasswordSchema } from '../shared/validators/password.validator';



const updatePasswordUseCase = new UpdatePasswordUseCase();

export const updatePasswordFromSettingsHandler = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        const userId = (request.user as any).id;
        const email = (request.user as any).email;
        const ip = request.ip;
        const userAgent = request.headers["user-agent"];

        // Validate body inputs
        const validateData = upadtePasswordSchema.parse(request.body);

        await updatePasswordUseCase.execute(userId, email, validateData, {
            ip,
            userAgent,
        });
        return reply.status(200).send({
            status: "SUCCESS",
            message: "Your password has been updated successfully.",
        });
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
            return reply
                .status(401)
                .send({ status: "FAIL", message: "Session invalid." });
        }
        if (err.name === "ZodError") {
            return reply.status(400).send({
                status: "FAIL",
                message: "Validation failed",
                errors: err.errors
            });
        }
        console.error("Password Update Error:", err);
        return reply.status(500).send({
          status: "ERROR",
          message: "An internal server error occurred.",
        });
    }

}