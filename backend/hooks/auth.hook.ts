import { FastifyRequest, FastifyReply } from "fastify";
import jwt from "jsonwebtoken";
import { prisma } from '../config/prisma';

export async function authenticateSession(request: FastifyRequest, reply: FastifyReply) {
  try {
    // Standardizing on 'access_token' cookie. Change to 'token' if your frontend uses that.
    const token = request.cookies.access_token || request.cookies.token;

    if (!token) {
      return reply.status(401).send({ 
        status: "UNAUTHORIZED", 
        message: "Authentication required. No session found." 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    // Force password change check for initial onboarding
    if (decoded.onboarding) {
      return reply.status(403).send({
        status: "FORBIDDEN",
        message: 'Access denied. You must change your password before using the system.'
      });
    }

    // Single optimized database lookup for user and their relational status
    const liveUser = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        isActive: true,
        isDeleted: true,
        billerId: true,
        agentId: true,
        biller: { select: { isDeleted: true } },
        agent: { select: { isDeleted: true } }
      }
    });

    if (!liveUser || !liveUser.isActive || liveUser.isDeleted) {
      return reply.status(403).send({
        status: "FORBIDDEN",
        message: "Your account has been deactivated or removed. Please contact an administrator.",
      });
    }

    if (liveUser.billerId && (!liveUser.biller || liveUser.biller.isDeleted)) {
      return reply.status(403).send({
        status: "FORBIDDEN",
        message: "Your organization account has been suspended.",
      });
    }

    if (liveUser.agentId && (!liveUser.agent || liveUser.agent.isDeleted)) {
      return reply.status(403).send({
        status: "FORBIDDEN",
        message: "Your agent terminal has been deactivated.",
      });
    }

    // Attach user payload to request decoration safely
    (request as any).user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      agentId: decoded.agentId,
      billerId: decoded.billerId,
    };

  } catch (error) {
    return reply.status(401).send({ 
      status: "UNAUTHORIZED", 
      message: "Invalid or expired session token." 
    });
  }
}