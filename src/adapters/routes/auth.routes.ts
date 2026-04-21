import { FastifyInstance } from "fastify";
import { RegisterUserUseCase } from "../../application/use-cases/auth/RegisterUserUseCase";
import { PrismaUserRepository } from "../../infrastructure/repositories/PrismaUserRepository";
import { LoginUseCase } from "../../application/use-cases/auth/LoginUseCase";
import { ApiResponse } from "../../shared/utils/ApiResponse";


const userRespo = new PrismaUserRepository();
const registerUseCase = new RegisterUserUseCase(userRespo);
const loginUseCase = new LoginUseCase(userRespo);

export async function authRoutes(fastify: FastifyInstance) {
    fastify.post('/auth/register', {
        schema: {
            body: {
                type: 'object',
                required: ['email', 'password', 'fullName', 'role'],
                properties: {
                    email: { type: 'string', format: 'email' },
                    password:{type:'string', minLength:6}
                }
            }
        }
    },async (request, reply) => {
        try {
            const user = await registerUseCase.execute(request.body as any);
            return { status: 'SUCCESS', userId: user.id };
        } catch (e: any) {
            return reply.status(400).send({ status: 'FAILED', message: e.message });
        }
    });

    // Login 
    fastify.post('/auth/login', {
        schema: {
            body: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                    email: { type: 'string', format: 'email' },
                    password:{type:'string', minLength:6}
                }
            }
        }
    }, async (request, reply) => {
        try {
            const { email, password } = request.body as any;
            const result = await loginUseCase.execute(email, password);
            return ApiResponse.success(result, 'Login successful');
        } catch (e: any) {
            return reply.status(401).send({ status: 'AUTH_FAILED', message: e.message });
        }
    });
}
        