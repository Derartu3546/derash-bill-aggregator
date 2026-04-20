import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyJwt from '@fastify/jwt';
import fastifyCookie from '@fastify/cookie';
import { adminRoutes, agentRoutes } from './api/routes/routes.ts';
import authRoutes from './api/routes/auth.routes.ts';

const fastify = Fastify({
  logger: true 
});
// 1. Register Cookie Plugin
 await fastify.register(fastifyCookie, {
  secret: "my-cookie-secret", // for signing cookies
});

// 2. Register JWT Plugin
 await fastify.register(fastifyJwt, {
  secret: process.env.JWT_SECRET || 'super-secret-key'
});

 await fastify.register(cors, {
  origin: 'http://localhost:5173',
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
  allowedHeaders: ["Content-Type",  "Authorization", 'x-admin-secret', 'x-api-key', 'x-agent-code'],
});

fastify.register(authRoutes, { prefix: "/api/v1/auth" });
fastify.register(agentRoutes, { prefix: '/api/v1/agent' });
fastify.register(adminRoutes, { prefix: '/api/v1/admin' });

fastify.get('/', async () => {
  return { status: 'OK', message: 'Derash Aggregator is running' };
});


const start = async () => {
  try {
    const PORT = 3000;
    await fastify.listen({ port: PORT, host: '0.0.0.0' });
    console.log(`
     Server is running at http://localhost:${PORT}
    `);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();