import { FastifyRequest, FastifyReply } from "fastify";
import jwt from "jsonwebtoken";
import { any } from "zod";

export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    // const authHeader = request.headers.authorization;

    // if (!authHeader) {
    //   return reply
    //     .status(401)
    //     .send({ message: "Authorization header missing" });
    // }

    // const parts = authHeader.split(" ");

    // if (parts.length !== 2 || parts[0] !== "Bearer") {
    //   return reply
    //     .status(401)
    //     .send({ message: "Invalid authorization format" });
    // }

    // const token = parts[1];

    const token = request.cookies.access_token;

    if (!token) {
      throw new Error('No session cookie found');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    // (request as any).user = decoded;
   (request as any).user = {
      id: decoded.userId,
      role: decoded.role,
      agentId: decoded.agentId,
      billerId: decoded.billerId,
    };
  } catch {
    return reply.status(401).send({ message: "Invalid or expired token" });
  }
}