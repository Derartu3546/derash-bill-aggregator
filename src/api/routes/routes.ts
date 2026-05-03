import { FastifyInstance } from 'fastify';
import { BillController } from '../controllers/agent/BillController.ts';
import { AdminDataController } from '../controllers/admin/AdminDataController.ts';

import { authorize } from '@/core/hooks/auth.hook.ts';
import { auditLogger } from '@/core/hooks/audit.hook.ts';
import { validateApiKey } from '@/core/hooks/api-key.hook.ts';

const billController = new BillController();

// --- ROUTES FOR AGENTS ---
export async function agentRoutes(fastify: FastifyInstance) {
  
  fastify.addHook('preHandler', validateApiKey); 
  fastify.addHook('preHandler', auditLogger);

  fastify.get("/dashboard", billController.getDashboard);
  fastify.get('/bill-inquiry/:reference', billController.getBillInfo);
  fastify.post('/confirm-payment', billController.processPayment);
  fastify.get('/my-report', billController.getAgentReport); 
}

// --- ROUTES FOR DERASH ADMINS ---
export async function adminRoutes(fastify: FastifyInstance) {
  const adminDataController = new AdminDataController();
  
  fastify.addHook('preHandler', authorize(['SUPER_ADMIN'])); 
  fastify.addHook('preHandler', auditLogger);

  fastify.get('/global-report', adminDataController.getAdminReport);
  fastify.get("/users", adminDataController.getUsers);
  fastify.get("/agents", adminDataController.getAgents);
  fastify.get("/billers", adminDataController.getBillers);
}