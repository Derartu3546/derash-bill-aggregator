import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '@/infrastructure/database/prisma.ts'; 

export async function auditLogger(request: FastifyRequest, reply: FastifyReply) {
  const { method, url, body, ip } = request;
  const agentCode = (request.headers['x-agent-code'] as string) || (body as any)?.agent_code;

  if (!agentCode) return; 

  reply.raw.on('finish', async () => {
    try {
      await prisma.agentEvent.create({
        data: {
          agent_code: agentCode, 
          payload: { method, url, statusCode: reply.statusCode, clientIp: ip } as any,
          error: reply.statusCode >= 400 ? `Error ${reply.statusCode}` : null
        },
      });
    } catch (err) {
      console.error("Audit log failed:", err);
    }
  });
}