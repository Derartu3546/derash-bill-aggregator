import { FastifyRequest, FastifyReply } from "fastify";
import jwt from "jsonwebtoken";
import { email } from "zod/mini";

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