import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../config/prisma";

export async function validateApiKey(request: FastifyRequest, reply: FastifyReply) {
  const apiKey = (request.headers["x-api-key"] || request.headers["X-API-KEY"]) as string;

  if (!apiKey) {
    return reply.status(401).send({
      success: false,
      error: "Unauthorized: Missing API Key",
    });
  }

  const agent = await prisma.agent.findUnique({
    where: { apiKey: apiKey },
  });

  if (!agent) {
    return reply.status(403).send({
      success: false,
      error: "Access Denied: Invalid API Key",
    });
  }

  // Decorate the request context with the validated agent info
  (request as any).agent = agent;
  (request as any).user = agent; // fallback compatibility
}