import { FastifyReply, FastifyRequest } from "fastify";
import bcrypt from "bcrypt";
import {prisma} from '../../config/prisma'
import "@fastify/jwt";
import "@fastify/cookie";
import crypto from 'crypto';


export const loginHandler = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { email, password } = request.body as any;
  console.log("--- DEBUG LOGIN ---");
  console.log("Raw IP:", request.ip);
  console.log("Raw UA:", request.headers["user-agent"]);
  console.log("-------------------");

  const meta = {
    userAgent: request.headers["user-agent"] || "Unknown Browser",
    // If request.ip is undefined, use the loopback address
    ipAddress: request.ip || "127.0.0.1",
  };
  // 1. Fetch user with relations
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      agent: true,
      biller: true,
    },
  });

  // 2. Validate user existence and status
  if (!user) {
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

  const refreshToken = crypto.randomBytes(40).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); 

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: refreshToken,
      expiresAt: expiresAt,
      userAgent: meta.userAgent, 
      ipAddress: meta.ipAddress, 
    },
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
    refreshToken,
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
      expires: new Date(0),
    })
    .send({ message: "Logged out successfully" });
}
