import { FastifyReply, FastifyRequest } from 'fastify';

/**
 * AUTHENTICATE & AUTHORIZE HOOK
 * ----------------------------
 * This hook handles two types of authentication:
 * 1. Admin Secret (System-to-System / Emergency Backdoor)
 * 2. JWT Session (User-to-System via HttpOnly Cookies)
 */
export const authorize = (allowedRoles: string[]) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    
    // --- 1. ADMIN SECRET KEY CHECK (The "Backdoor") ---
    const adminHeader = request.headers['x-admin-secret'] as string;
    const SECURE_ADMIN_KEY = process.env.ADMIN_SECRET_KEY;

    // If a key is provided in the header, check if it matches our environment variable
    if (adminHeader && SECURE_ADMIN_KEY && adminHeader === SECURE_ADMIN_KEY) {
      // If it matches, we "impersonate" a Super Admin to bypass further checks
      (request as any).user = {
        id: 'SYSTEM_INTERNAL',
        role: 'SUPER_ADMIN'
      };
      return; // Success! Skip JWT checks and enter the controller.
    }

    // --- 2. STANDARD JWT SESSION CHECK (The "Front Door") ---
    try {
      const token = request.cookies.token;

      if (!token) {
        return reply.status(401).send({ 
          success: false, 
          error: "UNAUTHORIZED", 
          message: "No session found. Please login." 
        });
      }

      // Verify JWT (fastify-jwt logic)
      const decoded: any = await request.jwtVerify();
      
      // 3. Role-Based Access Control (RBAC)
      if (!allowedRoles.includes(decoded.role)) {
        return reply.status(403).send({ 
          success: false, 
          error: "FORBIDDEN", 
          message: "Insufficient permissions for this resource." 
        });
      }

      // 4. Attach decoded data to request.user
      (request as any).user = {
        id: decoded.userId,
        role: decoded.role,
        agentId: decoded.agentId,
        billerId: decoded.billerId,
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