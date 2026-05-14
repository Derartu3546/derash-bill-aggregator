import { FastifyInstance } from "fastify";
import { RegisterUserUseCase } from "../services/auth/RegisterUserUseCase";
import { PrismaUserRepository } from "../models/PrismaUserRepository";
import { LoginUseCase } from "../services/auth/LoginUseCase";
import { ApiResponse } from "../shared/utils/ApiResponse";
import jwt from "jsonwebtoken";
import crypto from 'crypto';
import { authenticate } from "../middleware/auth.hook";
import { GetCurrentUserUseCase } from "../services/auth/GetCurrentUserUseCase";
import { CreateAuditLogUseCase } from "../services/admin/CreateAuditLogUseCase";
import { PrismaAuditRepository } from "../models/PrismaAuditRepository";
import { ChangePasswordUseCase } from "../services/auth/ChangePasswordUseCase";
import { ResetPasswordUseCase } from "../services/auth/ResetPasswordUseCase";




const userRespo = new PrismaUserRepository();
const registerUseCase = new RegisterUserUseCase(userRespo);
const loginUseCase = new LoginUseCase(userRespo);
const getCurrentUserUseCase = new GetCurrentUserUseCase(userRespo);
const auditRepo = new PrismaAuditRepository();
const createAuditUseCase = new CreateAuditLogUseCase(auditRepo);
const changePasswordUseCase = new ChangePasswordUseCase(userRespo);
const resetPasswordUseCase = new ResetPasswordUseCase(userRespo);

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
            
            const meta = {
              userAgent: request.headers["user-agent"] || "Unknown Device",
              ipAddress: request.ip || "127.0.0.1",
            };
            const result = await loginUseCase.execute(email, password, meta);
            if (!result.user) {
                throw new Error('Authenticated user data is missing');
            }
            

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

            if (result.mustChangePassword) {
                return ApiResponse.success({
                    mustChangePassword: true,
                    tempToken: result.tempToken,
                    user: result.user
                }, 'Password change required before accessing the system');
            }



            const { accessToken, refreshToken } = result;
            if (!accessToken || !refreshToken) {
              throw new Error('Failed to generate authentication tokens');
            }

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
            return ApiResponse.success({ user: result.user }, 'Login successful');
        } catch (err: any) {
            const body = request.body as any;
            const emailToLog = body?.email || "Unknown";
            await createAuditUseCase.execute({
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

        await userRespo.saveRefreshToken(savedToken.user.id, 
    newRefreshToken, 
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    request.headers["user-agent"], // Capture current UA
    request.ip);

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

    fastify.post("/auth/change-password", {
      schema: {
        body: {
          type: "object",
          required: ["newPassword", "token"],
              properties: {
                  newPassword: { type: 'string', minLength: 6 },
                  token:{type:'string'}
          }
        },
      },
    }, async (request, reply) => {
        try {
            const { newPassword, token } = request.body as any;

            const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

            await changePasswordUseCase.execute(decoded.id, newPassword);
            await createAuditUseCase.execute({
                userId: decoded.id,
                action: "PASSWORD_CHANGED_ONBOARDING",
                entityName: "User",
                entityId: decoded.id,
                status: 'SUCCESS',
                ipAddress: request.ip,
                description: "User completed first-time password change"
            });
            return ApiResponse.success(null, 'Password updated successfully. Please login with your new password.');
        } catch (err: any) {
            return reply.status(400).send({
                status: 'FAILED',
                message: err.name === 'JsonWebTokenError' ? 'Invalid or expired setup token' : err.message
            });
        }
    });

    fastify.post("/auth/reset-password", async (request, reply) => {
        const { token, newPassword } = request.body as any;

        try {
            await resetPasswordUseCase.execute(token, newPassword);
            return { status: "SUCCESS", message: "Password reset successful. You can now login." };
        } catch (e: any) {
            return reply.status(400).send({ status: "FAILED" , message: e.message});
        }
    });
}
        