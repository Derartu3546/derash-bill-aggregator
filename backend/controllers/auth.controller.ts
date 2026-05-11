import { FastifyReply, FastifyRequest } from "fastify";
import bcrypt from "bcrypt";
import { prisma } from "../config/prisma";
import "@fastify/jwt";
import "@fastify/cookie";


export const loginHandler = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { email, password } = request.body as any;

  // 1. Fetch user with relations
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      agent: true,
      biller: true,
    },
  });

  // 2. Validate user existence and status
  if (!user || !user.isActive) {
    return reply.status(401).send({ error: "Invalid credentials" });
  }

  // 3. Verify password
  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    return reply.status(401).send({ error: "Invalid credentials" });
  }

  // 4. Generate JWT
  const token = await (reply as any).jwtSign({
    userId: user.id,
    role: user.role,
  });


  // 5. Set Cookie
  reply.setCookie("token", token, {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 8 * 60 * 60, // 8 hours
  });

  // 6. Return Unified Data
  return reply.send({
    message: "Login successful",
    user: {
      id: user.id,
      name: user.fullName,
      role: user.role,

      // FIX: api_key -> apiKey (to match Unified Schema)
      agent: user.agent
        ? {
            id: user.agent.id,
            code: user.agent.code,
            apiKey: user.agent.apiKey,
            name: user.agent.name,
          }
        : null,

      biller: user.biller
        ? {
            id: user.biller.id,
            name: user.biller.name,
          }
        : null,
    },
  });
};

export async function logoutHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  reply
    .setCookie("token", "", {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: new Date(0), // Instantly expires the cookie
    })
    .send({ message: "Logged out successfully" });
}
