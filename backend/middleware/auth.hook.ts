import { FastifyRequest, FastifyReply } from "fastify";
import jwt from "jsonwebtoken";
import { prisma } from '../config/prisma';

export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {

    const token = request.cookies.access_token;

    if (!token) {
      throw new Error('No session cookie found');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    if (decoded.onboarding) {
      return reply.status(403).send({
        status: "FORBIDDEN",
        message:'Access denied. You must change your password before using the system.'
      });
    }

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
        message:
          "Your account has been deactivated or removed. Please contact an administrator.",
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
       (request as any).user = {
         id: decoded.id,
         email: decoded.email,
         role: decoded.role,
         agentId: decoded.agentId,
         billerId: decoded.billerId,
       };
  } catch {
    return reply.status(401).send({ message: "Invalid or expired token" });
  }
}