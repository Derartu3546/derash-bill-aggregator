import { FastifyInstance } from 'fastify';
import { BillController } from '../controllers/agent/BillController.ts';
import { auditLogger } from '@/core/middlewares/auditMiddleware.ts';
import { validateApiKey } from '@/core/middlewares/authMiddleware.ts';
import { validateAdminKey } from '@/core/middlewares/adminAuthMiddleware.ts';
import { AdminDataController } from '../controllers/admin/AdminDataController.ts';

const billController = new BillController();

// --- ROUTES FOR AGENTS ---
export async function agentRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', validateApiKey); // Protect all agent routes with API key validation
  fastify.addHook('preHandler', auditLogger);

  fastify.get("/dashboard",billController.getDashboard)
  fastify.get('/bill-inquiry/:reference', billController.getBillInfo);
  fastify.post('/confirm-payment', billController.processPayment);
 
  
  fastify.get('/my-report', billController.getAgentReport); 
}

// --- ROUTES FOR DERASH ADMINS ---
export async function adminRoutes(fastify: FastifyInstance) {
    const adminDataController = new AdminDataController();
    
  fastify.addHook('preHandler', validateAdminKey); // Protect admin routes with admin key validation
  fastify.addHook('preHandler', auditLogger);

  fastify.get('/global-report', adminDataController.getAdminReport);
  fastify.get("/users", AdminDataController.getUsers);
  fastify.get("/agents", AdminDataController.getAgents);
  fastify.get("/billers", AdminDataController.getBillers);
}