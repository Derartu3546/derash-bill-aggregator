import { FastifyInstance } from "fastify";
import { updateUserSettings } from "../controllers/user/UserController";
import { updatePasswordFromSettingsHandler } from "../controllers/user/userPassword.controller";
import { authenticate } from "../middleware/auth.hook";
import { getUserSettingsHandler } from "../controllers/user/UserController";
import {
  getSessionHandler,
  revokeSessionHandler,
  revokeAllOtherSessionsHandler,
} from "../controllers/auth/session.controller";

export async function userRoutes(fastify: FastifyInstance) {
    fastify.addHook('onRequest', authenticate);

    // General Settings (Theme, language, notifications)
    fastify.patch("/settings", updateUserSettings);

    fastify.get("/settings", getUserSettingsHandler);

    // Voluntarily change password from settings dashboard
    fastify.post("/update-password", updatePasswordFromSettingsHandler);

    // Session Management
    fastify.get("/sessions", getSessionHandler);
    fastify.delete("/sessions/:sessionId", revokeSessionHandler);
    // Revoke all other sessions
    fastify.delete("/sessions/purge-others", revokeAllOtherSessionsHandler);
}