import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../config/prisma";

export const validateApiKey = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  // Supports both lowercase and uppercase header variants
  const apiKey = (request.headers["x-api-key"] ||
    request.headers["X-API-KEY"]) as string;

  if (!apiKey) {
    return reply.status(401).send({
      success: false,
      error: "Unauthorized: Missing API Key",
    });
  }

  // FIX: api_key -> apiKey (to match Unified Schema)
  const agent = await prisma.agent.findUnique({
    where: { apiKey: apiKey },
  });

  if (!agent) {
    return reply.status(403).send({
      success: false,
      error: "Access Denied: Invalid API Key",
    });
  }

  // Attach the agent to the request object for use in controllers
  (request as any).agent = agent;
  (request as any).user = agent;
};

export async function checkSession(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const token = request.cookies.token;

  if (!token) {
    if (
      request.url.includes("/api/v1/agent") ||
      request.url.includes("/api/v1/admin")
    ) {
      return reply
        .code(401)
        .send({ error: "Authentication required. No session found." });
    }
  }

  try {
    // Tell TypeScript to treat request as 'any' just for this call
    await (request as any).jwtVerify();
  } catch (err) {
    return reply.code(401).send({ error: "Invalid or expired session" });
  }
}
