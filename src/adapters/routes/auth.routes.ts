import { FastifyInstance } from "fastify";
import { RegisterUserUseCase } from "../../application/use-cases/auth/RegisterUserUseCase";
import { PrismaUserRepository } from "../../infrastructure/repositories/PrismaUserRepository";
import { LoginUseCase } from "../../application/use-cases/auth/LoginUseCase";
import { ApiResponse } from "../../shared/utils/ApiResponse";
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { authenticate } from "../hooks/auth.hook";
import { GetCurrentUserUseCase } from "../../application/use-cases/auth/GetCurrentUserUseCase";
import { CreateAuditLogUseCase } from "../../application/use-cases/admin/CreateAuditLogUseCase";
import { PrismaAuditRepository } from "../../infrastructure/repositories/PrismaAuditRepository";
import { email } from "zod";



const userRespo = new PrismaUserRepository();
const registerUseCase = new RegisterUserUseCase(userRespo);
const loginUseCase = new LoginUseCase(userRespo);
const getCurrentUserUseCase = new GetCurrentUserUseCase(userRespo);
const auditRepo = new PrismaAuditRepository();
const createAuditUseCase = new CreateAuditLogUseCase(auditRepo);

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
            await createAuditUseCase.execute({
              userId: result.user.id,
              userEmail: result.user.email,
              action: "LOGIN",
              entityName: "User",
              entityId: result.user.id,
              newValues: { loginTime: new Date() },
              ipAddress: request.ip,
                userAgent: request.headers["user-agent"],
              status:'SUCCESS'
            });

            const { accessToken, refreshToken, user } = result;

            reply.setCookie("access_token", accessToken, {
              path: "/",
              httpOnly: true,
              maxAge: 900,
            });
            reply.setCookie("refresh_token", refreshToken, {
              httpOnly: true,
              path: "/api/v1/auth/refresh",
              maxAge: 604800
            });
            return ApiResponse.success({user}, 'Login successful');
        } catch (err: any) {
            await createAuditUseCase.execute({
              userEmail: email,
              action: "LOGIN_FAILED",
              entityName: "Auth",
              entityId: "N/A",
              newValues: { reason: err.message },
              ipAddress: request.ip,
              userAgent: request.headers["user-agent"],
              status: "FAILED",
            });
            return reply.status(401).send({ status: 'AUTH_FAILED', message: err.message });
        }
    });

    fastify.post('/auth/refresh', async (request, reply) => {
        const oldToken = request.cookies.refresh_token;

        if (!oldToken) return reply.status(401).send({ message: 'No refresh session' });
        // Find token in DB
        const savedToken = await userRespo.findRefreshToken(oldToken);

        if (!savedToken) {
            console.log('SECURITY ALERT: Attempted use of an invalid or rotated token!.');
            return reply.status(401).send({ message: 'Session expired' });
        }
        if (savedToken.expiresAt < new Date()) {
            await userRespo.deleteRefreshToken(oldToken);
            return reply.status(401).send({ message: 'Session expired' });
        }

        await userRespo.deleteRefreshToken(oldToken);

        const newAccessToken = jwt.sign({ id: savedToken.user.id, role: savedToken.user.role }, process.env.JWT_SECRET!, { expiresIn: '15m' });
        const newRefreshToken = crypto.randomBytes(40).toString('hex');

        await userRespo.saveRefreshToken(savedToken.user.id, newRefreshToken, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));

        reply.setCookie("access_token", newAccessToken, {
            path: "/",
            httpOnly: true,
            maxAge: 900,
        });
        reply.setCookie("refresh_token", newRefreshToken, {
            path: "/api/v1/auth/refresh",
            httpOnly: true,
            maxAge: 604800,
        });

        return { status: 'SUCCESS' };
    });

    fastify.get('/auth/me', { preHandler: [authenticate] }, async (request, reply) => {
        try {
            const userId = (request as any).user.id;
            const user = await getCurrentUserUseCase.execute(userId);

            return ApiResponse.success({user});
        } catch (e: any) {
            return reply.status(401).send({ status: 'FAILED', message: e.message });
        }
    });
}
        