import { FastifyRequest, FastifyReply } from 'fastify';

export const validateAdminKey = async (request: FastifyRequest, reply: FastifyReply) => {
  const adminSecret = request.headers['x-admin-secret'] as string;

  // In production, this would check a JWT token or a specific Admin table
  const MASTER_KEY = "DERASH_SUPER_SECRET_2026"; 

  if (!adminSecret || adminSecret !== MASTER_KEY) {
    return reply.status(403).send({ 
      success: false, 
      message: "Access Denied: You do not have Administrative privileges." 
    });
  }
};