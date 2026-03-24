import Fastify from 'fastify';
import cors from '@fastify/cors';
import { adminRoutes, agentRoutes } from './api/routes/agent.routes.ts';

const fastify = Fastify({
  logger: true 
});

 await fastify.register(cors, {
  origin: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", 'x-admin-secret', 'x-api-key', 'x-agent-id'],
});

fastify.register(agentRoutes, { prefix: '/api/v1/agent' });
fastify.register(adminRoutes, { prefix: '/api/v1/admin' });

fastify.get('/', async () => {
  return { status: 'OK', message: 'Derash Aggregator is running' };
});

// 4. Start the Server
const start = async () => {
  try {
    const PORT = 3000;
    await fastify.listen({ port: PORT, host: '0.0.0.0' });
    console.log(`
     Server is running at http://localhost:${PORT}
    Test Inquiry: http://localhost:${PORT}/api/v1/agent/bill-inquiry/REF-WATER-01
    `);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();