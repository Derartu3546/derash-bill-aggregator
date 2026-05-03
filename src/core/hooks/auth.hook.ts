import { FastifyReply, FastifyRequest } from 'fastify';

export const authorize = (allowedRoles: string[]) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    
    const adminHeader = request.headers['x-admin-secret'] as string;
    const SECURE_ADMIN_KEY = process.env.ADMIN_SECRET_KEY;

   
    if (adminHeader && SECURE_ADMIN_KEY && adminHeader === SECURE_ADMIN_KEY) {
      
      (request as any).user = {
        id: 'SYSTEM_INTERNAL',
        role: 'SUPER_ADMIN'
      };
      return; 
    }

   
    try {
      const token = request.cookies.token;

      if (!token) {
        return reply.status(401).send({ 
          success: false, 
          error: "UNAUTHORIZED", 
          message: "No session found. Please login." 
        });
      }

    
      const decoded: any = await request.jwtVerify();
      
    
      if (!allowedRoles.includes(decoded.role)) {
        return reply.status(403).send({ 
          success: false, 
          error: "FORBIDDEN", 
          message: "Insufficient permissions for this resource." 
        });
      }

    
      (request as any).user = {
        id: decoded.id || decoded.userId,
        role: decoded.role,
        agent_id: decoded.agent_id || decoded.agentId,
        agentId: decoded.agentId  || decoded.agent_id,
        billerId: decoded.biller_id || decoded.billerId,
        biller_id: decoded.biller_id || decoded.billerId,
        
      };

    } catch (err) {
      return reply.status(401).send({ 
        success: false, 
        error: "SESSION_EXPIRED", 
        message: "Your session has expired. Please login again." 
      });
    }
  };
};