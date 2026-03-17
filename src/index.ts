import Fastify from "fastify";
import { authRoutes } from "./adapters/routes/auth.routes";
import { billerRoutes } from "./adapters/routes/biller.routes";
import { z } from "zod";
import { prisma } from "../src/infrastructure/database/prisma";
import multipart from "@fastify/multipart";
import cors from "@fastify/cors";
import bcrypt from "bcrypt";

const fastify = Fastify({ logger: true });

// CORS
fastify.register(cors, {
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
});

// Multipart
fastify.register(multipart, {
  limits: { fileSize: 5 * 1024 * 1024 },
});

// Routes
fastify.register(authRoutes, { prefix: "/api/v1" });
fastify.register(billerRoutes, { prefix: "/api/v1" });

// Health Check
fastify.get("/health", async () => {
  return { status: "UP", timestamp: new Date().toISOString() };
});

// Error handler
fastify.setErrorHandler((error: unknown, request, reply) => {
  if (error instanceof z.ZodError) {
    return reply.status(400).send({
      status: "VALIDATION_ERROR",
      errors: error.issues.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      })),
    });
  }

  if (error instanceof Error) {
    return reply.status(500).send({ status: "ERROR", message: error.message });
  }

  return reply.status(500).send({ status: "ERROR", message: "Unknown error" });
});

// Example Login Route
fastify.post("/api/v1/login", async (req, reply) => {
  const body = req.body as { email: string; password: string };
  console.log("LOGIN ATTEMPT:", body);

  const user = await prisma.user.findUnique({ where: { email: body.email } });
  console.log("USER FOUND IN DB:", user ? "YES" : "NO");

  if (!user) return reply.status(404).send({ message: "User not found" });

  const isMatch = await bcrypt.compare(body.password, user.passwordHash);
  console.log("PASSWORD MATCH:", isMatch);

  if (!isMatch) return reply.status(401).send({ message: "Invalid password" });

  return reply.send({
    message: "Login successful",
    user: { id: user.id, email: user.email },
  });
});

// Start server
const start = async () => {
  try {
    await fastify.listen({ port: 5000 });
    console.log("Derash Server running at http://localhost:5000");
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

// Graceful shutdown
const shutdown = async (signal: string) => {
  console.log(`\nReceived ${signal}. Shutting down gracefully...`);
  await fastify.close();
  await prisma.$disconnect();
  console.log("Database disconnected. Process exited.");
  process.exit(0);
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

start();
