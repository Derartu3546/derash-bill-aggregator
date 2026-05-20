import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../config/prisma";

export async function auditLogger(request: FastifyRequest, reply: FastifyReply) {
  const { method, url, body, ip } = request;
  const agentCode = (request.headers["x-agent-code"] as string) || (body as any)?.agent_code;

  if (!agentCode) return;

  // Utilizing Fastify's native response stream tracking cleanly
  reply.raw.on("finish", async () => {
    try {
      const agent = await prisma.agent.findUnique({
        where: { code: agentCode },
        select: { id: true },
      });

      if (!agent) {
        console.warn(`Audit Log: Agent with code ${agentCode} not found.`);
        return;
      }

      await prisma.agentEvent.create({
        data: {
          agentId: agent.id,
          action: `${method} ${url}`,
          payload: {
            method,
            url,
            requestBody: body,
            statusCode: reply.statusCode,
            clientIp: ip,
          } as any,
          processed: reply.statusCode < 400,
        },
      });
    } catch (err) {
      console.error("Audit log execution dropped:", err);
    }
  });
}