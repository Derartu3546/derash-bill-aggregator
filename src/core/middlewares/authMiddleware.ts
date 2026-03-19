import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '@/core/lib/prisma.ts'; 

export const validateApiKey = async (request: FastifyRequest, reply: FastifyReply) => {
  const apiKey = request.headers['x-api-key'] as string;

  if (!apiKey) {
    return reply.status(401).send({ 
      success: false, 
      message: "Security Alert: API Key is missing." 
    });
  }

  // Look up the agent who owns this key
  const agent = await prisma.agent.findUnique({
    where: { api_key: apiKey }
  });

  if (!agent) {
    return reply.status(403).send({ 
      success: false, 
      message: "Access Denied: Invalid API Key." 
    });
  }

  // Attach the agent object to the request so controllers can use it
  (request as any).agent = agent;
};