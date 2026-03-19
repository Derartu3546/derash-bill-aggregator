import { FastifyInstance } from 'fastify';
import { BillController } from '../controllers/agent/BillController.ts';
import { auditLogger } from '@/core/middlewares/auditMiddleware.ts';
import { validateApiKey } from '@/core/middlewares/authMiddleware.ts';
import { validateAdminKey } from '@/core/middlewares/adminAuthMiddleware.ts';

const billController = new BillController();

export async function agentRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', validateApiKey); // Protect all agent routes with API key validation
  fastify.addHook('preHandler', auditLogger);

  fastify.get('/bill-inquiry/:reference', billController.getBillInfo);
  fastify.post('/confirm-payment', billController.processPayment);
  
  fastify.get('/my-report', billController.getAgentReport); 
}

// --- ROUTES FOR DERASH ADMINS ---
export async function adminRoutes(fastify: FastifyInstance) {
 
  fastify.addHook('preHandler', validateAdminKey); // Protect admin routes with admin key validation
  fastify.addHook('preHandler', auditLogger);

  fastify.get('/global-report', billController.getAdminReport);
}