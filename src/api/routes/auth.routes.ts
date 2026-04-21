import { FastifyInstance } from 'fastify';
import { loginHandler } from '../controllers/auth.controller.ts';
import { authorize } from '@/core/middlewares/auth.hook.ts';

export default async function authRoutes(fastify: FastifyInstance) {
  
  fastify.post('/login', loginHandler);

  fastify.get('/admin-only', {
    preHandler: [authorize(['SUPER_ADMIN'])]
  }, async () => {
    return { message: "Hello Admin" };
  });
}