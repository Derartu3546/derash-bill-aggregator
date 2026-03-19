import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '@/core/lib/prisma.ts'; 

export async function auditLogger(request: FastifyRequest, reply: FastifyReply) {
  const { method, url, body, ip } = request;
  
  // We now look for a code (like 'CBE') instead of a UUID
  const agentCode = (request.headers['x-agent-code'] as string) || (body as any)?.agent_code;

  if (!agentCode) return; 

  reply.raw.on('finish', async () => {
    try {
      await prisma.agentEvent.create({
        data: {
          agent_code: agentCode, // Matches your new schema field
          payload: {             // Matches your new Json type
            method,
            url,
            requestBody: body as any,
            statusCode: reply.statusCode,
            clientIp: ip
          } as any,
          // 'processed' defaults to false automatically based on your schema
          error: reply.statusCode >= 400 ? `HTTP Error ${reply.statusCode}` : null
        },
      });
    } catch (err: any) {
      console.error("Audit log failed:", err);
    }
  });
}