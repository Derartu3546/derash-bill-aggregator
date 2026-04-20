import { FastifyInstance } from 'fastify';

import { authorize } from '@/core/middlewares/auth.hook.ts';
import { loginHandler } from '../controllers/auth.controller.ts';

export default async function authRoutes(fastify: FastifyInstance) {
  
  fastify.post('/login', loginHandler);

  fastify.get('/admin-only', {
    preHandler: [authorize(['SUPER_ADMIN'])]
  }, async () => {
    return { message: "Hello Admin" };
  });
}