import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaUserRepository } from "../../infrastructure/repositories/PrismaUserRepository.ts";
import { LoginUseCase } from '@/application/use-cases/auth/LoginUseCase.ts';
import { ApiResponse } from '@/shared/utils/ApiResponse.ts';

const userRepo = new PrismaUserRepository();
const loginUseCase = new LoginUseCase(userRepo);

export const loginHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  const { email, password } = request.body as any;

  try {
    const user = await loginUseCase.execute(email, password);

    const token = await reply.jwtSign({ 
    userId: user.id, 
    role: user.role ,
    biller_id: user.biller_id, 
    agent_id: user.agent_id
  });


  reply.setCookie('token', token, {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 8 * 60 * 60 
  });

    const userData = {
      id: user.id,
      name: user.name,
      role: user.role,

      agent: user.agent ? {
        id: user.agent_id,
        code: user.agent.code,
        api_key: user.agent.api_key,
        name: user.agent.name
      } : null,
      biller: user.biller ? {
        id: user.biller_id,
        name: user.biller.name
      } : null
    };

  
    return ApiResponse.success({ user: userData, token }, 'Login successful');

  } catch (error: any) {
    return reply.status(401).send(
      ApiResponse.error(error.message, 'AUTH_FAILED')
    );
  }
};

export async function logoutHandler(request: FastifyRequest, reply: FastifyReply) {
  reply
    .setCookie('token', '', {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: new Date(0),
    })
    .send(ApiResponse.success(null, 'Logged out successfully'));
}