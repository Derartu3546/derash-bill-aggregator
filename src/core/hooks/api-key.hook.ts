import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '@/infrastructure/database/prisma.ts'; 

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
};

