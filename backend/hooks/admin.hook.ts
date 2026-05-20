import { FastifyRequest, FastifyReply } from 'fastify';

export async function validateAdminKey(request: FastifyRequest, reply: FastifyReply) {
  const adminSecret = (request.headers['x-admin-secret'] || request.headers['X-ADMIN-SECRET']) as string;
  const MASTER_KEY = process.env.ADMIN_MASTER_KEY || "DERASH_SUPER_SECRET_2026"; 

  if (!adminSecret || adminSecret !== MASTER_KEY) {
    return reply.status(403).send({ 
      success: false, 
      message: "Access Denied: You do not have Administrative privileges." 
    });
  }
}