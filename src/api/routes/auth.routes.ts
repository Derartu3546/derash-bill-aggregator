import { FastifyInstance } from 'fastify';
import { RegisterUserUseCase } from "../../application/use-cases/auth/RegisterUserUseCase.ts";
import { PrismaUserRepository } from "../../infrastructure/repositories/PrismaUserRepository.ts";
import { loginHandler, logoutHandler } from "../controllers/auth.controller.ts";
import { authorize } from "@/core/hooks/auth.hook.ts";


const userRepo = new PrismaUserRepository();
const registerUseCase = new RegisterUserUseCase(userRepo);


export default async function authRoutes(fastify: FastifyInstance) {
  
 
  fastify.post('/register', {
    schema: {
      body: {
        type: 'object',
        required: ['email', 'password', 'fullName', 'role'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 6 },
          fullName: { type: 'string' },
          role: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const user = await registerUseCase.execute(request.body as any);
      return { status: 'SUCCESS', userId: user.id };
    } catch (e: any) {
      return reply.status(400).send({ status: 'FAILED', message: e.message });
    }
  });

  
  fastify.post('/login', {
    schema: {
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 6 }
        }
      }
    }
  }, loginHandler);

  
  fastify.post('/logout', logoutHandler);

  
  fastify.get('/admin-only', {
    preHandler: [authorize(['SUPER_ADMIN'])]
  }, async () => {
    return { message: "Hello Admin, the system is secure." };
  });
}