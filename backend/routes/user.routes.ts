import { FastifyInstance } from "fastify";
import { updateUserSettings } from "../controllers/UserController";
import { authenticate } from "../middleware/auth.hook";

export async function userRoutes(fastify: FastifyInstance) {
    fastify.addHook('onRequest', authenticate);

    fastify.patch("/settings", updateUserSettings);
}