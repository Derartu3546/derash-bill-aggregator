import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '@/core/lib/prisma.ts'; 

export const validateApiKey = async (request: FastifyRequest, reply: FastifyReply) => {

  const apiKey = (request.headers['x-api-key'] || request.headers['X-API-KEY']) as string;

  if (!apiKey) {
    return reply.status(401).send({ 
      success: false,
      error: "Unauthorized: Missing API Key" 
    });
  }

  const agent = await prisma.agent.findUnique({
    where: { api_key: apiKey }
  });
  
if (!agent) {
    return reply.status(403).send({ 
      success: false,
      error: "Access Denied: Invalid API Key" 
    });
  }

 
  (request as any).agent = agent;
  (request as any).user = agent; 
};

export async function checkSession(request: FastifyRequest, reply: FastifyReply) {
  const token = request.cookies.token;

  if (!token) {
   
    if (request.url.includes('/api/v1/agent') || request.url.includes('/api/v1/admin')) {
      return reply.code(401).send({ error: "Authentication required. No session found." });
    }
  }

  try {
    
    await request.jwtVerify();
  } catch (err) {
    return reply.code(401).send({ error: "Invalid or expired session" });
  }
}