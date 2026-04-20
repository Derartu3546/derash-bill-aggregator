import { FastifyReply, FastifyRequest } from 'fastify';
import bcrypt from 'bcrypt';
import { prisma } from '@/core/lib/prisma.ts';

export const loginHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  const { email, password } = request.body as any;


  const user = await prisma.user.findUnique({
    where: { email },
    include: { agent: true, 
               biller: true }
  });

  if (!user || !user.isActive) {
    return reply.status(401).send({ error: "Invalid credentials" });
  }


  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return reply.status(401).send({ error: "Invalid credentials" });
  }


  const token = await reply.jwtSign({ 
    userId: user.id, 
    role: user.role 
  });


  reply.setCookie('token', token, {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 8 * 60 * 60 
  });


return {
  message: "Login successful",
  user: {
    id: user.id,
    name: user.name,
    role: user.role,
   
    agent: user.agent ? {
      id: user.agent.id,
      code: user.agent.code,
      api_key: user.agent.api_key,
      name: user.agent.name
    } : null,
    biller: user.biller ? {
      id: user.biller.id,
      name: user.biller.name
    } : null
  }
};
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
    .send({ message: 'Logged out successfully' });
}