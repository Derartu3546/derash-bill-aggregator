import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyJwt from '@fastify/jwt';
import fastifyCookie from '@fastify/cookie';
import multipart from "@fastify/multipart";
import { z } from "zod";
import { prisma } from "./infrastructure/database/prisma.ts";

// Routes
import { adminRoutes, agentRoutes } from './api/routes/routes.ts';

import { billerRoutes } from './api/routes/biller.routes.ts';
import authRoutes from './api/routes/auth.routes.ts';

const fastify = Fastify({
  logger: true 
});

// --- 1. PLUGINS REGISTRATION ---

// Multipart (For CSV Uploads) - MUST be registered before routes
await fastify.register(multipart, {
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// Cookies (For secure JWT storage)
await fastify.register(fastifyCookie, {
  secret: process.env.COOKIE_SECRET, 
});

// JWT
await fastify.register(fastifyJwt, {
  secret: process.env.JWT_SECRET || 'super-secret-key',
  cookie: {
    cookieName: 'token',
    signed: false // Set to true if you use signed cookies in authorize hook
  }
});

// CORS (Updated to be secure but allow your frontend)
await fastify.register(cors, {
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'], // Common Vite ports
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true, // Required for Cookies
  allowedHeaders: [
    "Content-Type", 
    "Authorization", 
    'x-admin-secret', 
    'x-api-key', 
    'x-agent-code'
  ],
});

// --- 2. GLOBAL ERROR HANDLER ---
// This centralizes error logic so your controllers stay clean
fastify.setErrorHandler((error: unknown, request, reply) => {
  // Handle Zod Validation Errors
  if (error instanceof z.ZodError) {
    return reply.status(400).send({
      success: false,
      error: "VALIDATION_ERROR",
      details: error.issues.map((e) => ({
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


// --- 3. ROUTES REGISTRATION ---
fastify.register(authRoutes, { prefix: "/api/v1/auth" });
fastify.register(agentRoutes, { prefix: '/api/v1/agent' });
fastify.register(adminRoutes, { prefix: '/api/v1/admin' });
fastify.register(billerRoutes, { prefix: '/api/v1/biller' });

// Health Check
fastify.get('/health', async () => {
  return { 
    status: 'UP', 
    message: 'Derash Aggregator Service is healthy',
    timestamp: new Date().toISOString() 
  };
});

// --- 4. SERVER STARTUP & SHUTDOWN ---
const start = async () => {
  try {
    const PORT = Number(process.env.PORT) || 3000;
    await fastify.listen({ port: PORT, host: '0.0.0.0' });
    console.log(`Derash Server running at http://localhost:${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

// Graceful shutdown (Important for production)
const shutdown = async (signal: string) => {
  console.log(`\nReceived ${signal}. Cleaning up...`);
  await fastify.close();
  await prisma.$disconnect();
  console.log("Database disconnected. Goodbye!");
  process.exit(0);
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

start();