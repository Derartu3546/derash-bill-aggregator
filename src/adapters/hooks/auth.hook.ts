import { FastifyRequest, FastifyReply } from "fastify";
import jwt from "jsonwebtoken";
import { any } from "zod";

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
   (request as any).user = {
      id: decoded.id,
      role: decoded.role,
      agentId: decoded.agentId,
      billerId: decoded.billerId,
    };
  } catch {
    return reply.status(401).send({ message: "Invalid or expired token" });
  }
}