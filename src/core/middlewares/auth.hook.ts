import { FastifyReply, FastifyRequest } from 'fastify';

export const authorize = (roles: string[]) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
    
      const token = request.cookies.token;

      if (!token) {
        return reply.status(401).send({ error: "Unauthorized" });
      }

      const decoded: any = await request.jwtVerify();
      
      if (!roles.includes(decoded.role)) {
        return reply.status(403).send({ error: "Access Denied" });
      }
    } catch (err) {
      return reply.status(401).send({ error: "Session Expired" });
    }
  };
};