import Fastify from "fastify";
import fastifyJwt from "@fastify/jwt";
import { authRoutes } from "./routes/auth.routes";
import { billerRoutes } from "./routes/biller.routes";
import { prisma } from "./config/prisma";
import multipart from "@fastify/multipart";
import cors from "@fastify/cors";
import fastifyCookie from "@fastify/cookie";
import { billRoutes } from "./routes/billRoutes";
import { adminRoutes } from "./routes/routes";
import { agentsRoutes } from "./routes/agent.routes";
import { agentRoutes } from "./routes/routes";
import { z } from "zod";



const fastify = Fastify({ logger: true });

// CORS
fastify.register(cors, {
  origin: "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"],
});

fastify.register(fastifyCookie, {
  secret: "4dr0srh-ecet-ky-s2a2ee",
  hook: "onRequest",
  parseOptions: {},
});

// Multipart
fastify.register(multipart, {
  limits: { fileSize: 5 * 1024 * 1024 },
});

// Routes
fastify.register(authRoutes, { prefix: "/api/v1" });
fastify.register(billerRoutes, { prefix: "/api/v1" });
fastify.register(agentsRoutes, { prefix: "/api/v1" });
fastify.register(billRoutes, { prefix: "/api/v1" });
fastify.register(adminRoutes, { prefix: "/api/v1/admin" });


fastify.register(agentRoutes, { prefix: "/api/v1/agent" });




// Health Check
fastify.get("/health", async () => {
  return {
    status: "UP",
    timestamp: new Date().toISOString(),
  };
});

// Error handler
fastify.setErrorHandler((error: unknown, request, reply) => {
  // 1. Handle Zod Errors
  if (error instanceof z.ZodError) {
    const zodError = error as z.ZodError; // explicit local assignment
    return reply.status(400).send({
      status: "VALIDATION_ERROR",
      errors: zodError.issues.map((e:z.ZodIssue) => ({
        field: e.path.join("."),
        message: e.message,
      })),
    });
  }

  // 2. Handle standard Error objects
  if (error instanceof Error) {
    return reply.status(500).send({
      status: "ERROR",
      message: error.message,
    });
  }

  // 3. Fallback for truly unknown types (strings, null, etc.)
  return reply.status(500).send({
    status: "ERROR",
    message: typeof error === "string" ? error : "An unexpected error occurred",
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
