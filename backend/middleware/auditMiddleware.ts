import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../config/prisma";

export async function auditLogger(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { method, url, body, ip } = request;

  // We still look for the agent code in the headers or body
  const agentCode =
    (request.headers["x-agent-code"] as string) || (body as any)?.agent_code;

  if (!agentCode) return;

  reply.raw.on("finish", async () => {
    try {
      // 1. We need the ID because your schema uses agentId (Relation)
      const agent = await prisma.agent.findUnique({
        where: { code: agentCode },
        select: { id: true },
      });

      if (!agent) {
        console.warn(`Audit Log: Agent with code ${agentCode} not found.`);
        return;
      }

      // 2. Create the event using the Unified Schema fields
      await prisma.agentEvent.create({
        data: {
          agentId: agent.id, // Updated: agent_code -> agentId
          action: `${method} ${url}`, // Added: Required field in your schema
          payload: {
            method,
            url,
            requestBody: body as any,
            statusCode: reply.statusCode,
            clientIp: ip,
          } as any,
          processed: reply.statusCode < 400, // Logic: If it's a 200, it's processed
        },
      });
    } catch (err: any) {
      console.error("Audit log failed:", err);
    }
  });
}
