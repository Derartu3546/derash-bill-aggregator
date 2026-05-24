import Fastify from "fastify";
import jwt from '@fastify/jwt';
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
import { userRoutes } from "./routes/user.routes";
import { z } from "zod";
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui'



const fastify = Fastify({
  logger: {
    level: "info",
  },
  trustProxy: true,
});



// CORS - Updated for Deployment
fastify.register(cors, {
  origin: ["https://derash-frontend.vercel.app", "http://localhost:5173"],
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization", "x-admin-secret","x-agent-code", "Cookie"],
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

fastify.register(swagger, {
  openapi: {
    info: {
      title: "Derash Bill Aggregator API",
      description: "Backend API documentation for Billers, Agents, and Admins",
      version: "1.0.0",
    },
    security: [
      {cookieAuth:[]}
    ],
    tags: [
      { name: "Authentication", description: "Login and Session Management" },
      { name: "Biller", description: "Bill ingestion and Biller management" },
      {
        name: "Admin",
        description: "System-wide monitoring and notifications",
      },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "access_token",
        },
      },
    },
  },
});

fastify.register(swaggerUi, {
  routePrefix: "/docs",
  uiConfig: {
    docExpansion: 'list',
    deepLinking: false,
  },
});

fastify
// Routes
fastify.register(authRoutes, { prefix: "/api/v1" });
fastify.register(billerRoutes, { prefix: "/api/v1" });
fastify.register(agentsRoutes, { prefix: "/api/v1" });
fastify.register(billRoutes, { prefix: "/api/v1" });
fastify.register(adminRoutes, { prefix: "/api/v1/admin" });


fastify.register(agentRoutes, { prefix: "/api/v1/agent" });
fastify.register(userRoutes, { prefix: "/api/v1/user" });


fastify.get("/", async (request, reply) => {
  return {
    status: "online",
    message: "Derash Bill Aggregator API is running!",
    version: "1.0.0",
  };
});

// Health Check
fastify.get("/api/v1/health", async () => {
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

// Export fastify for testing
export { fastify };

// Start server ONLY if not in a test environment
if (process.env.NODE_ENV !== 'test') {
  const start = async () => {
    try {
      await fastify.listen({
        port: Number(process.env.PORT) || 5000,
        host: "0.0.0.0",
      });
      console.log("Derash Server running at http://localhost:5000");
    } catch (err) {
      fastify.log.error(err);
      process.exit(1);
    }
  };
  start();
}
