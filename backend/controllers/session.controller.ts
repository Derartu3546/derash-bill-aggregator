import { FastifyReply, FastifyRequest } from "fastify";
import { SessionManagementUseCase } from "../services/auth/SessionManagementUseCase";
import {prisma} from '../config/prisma'
import { AuditService } from "../services/AuditService";




const sessionUseCase = new SessionManagementUseCase();


export const getSessionHandler = async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = (request.user as any).id;
    const sessions = await sessionUseCase.getActiveSessions(userId);
    return reply.send({ status: "SUCCESS", data: sessions });
};

export const revokeSessionHandler = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        const userId = (request.user as any).id;
    const { sessionId } = request.params as { sessionId: string };

    await sessionUseCase.revokeSession(userId, sessionId);

    return reply.send({ 
      status: "SUCCESS", 
      message: "Session revoked successfully. That device is now logged out." 
    });
    } catch (error: any) {
        if (error.message === "SESSION_NOT_FOUND") {
          return reply
            .status(404)
            .send({ status: "FAIL", message: "Session not found." });
        }
        throw error;
    }

    
}

export const revokeAllOtherSessionsHandler = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        const user = request.user as any;
        const userId = user.id;
        const email = user.email;
        const ip = request.ip;
        const userAgent = request.headers["user-agent"];
        // Get the current refresh token string from cookies
        const currentRefreshToken = request.cookies.refresh_token;
        
        if (!currentRefreshToken) {
            return reply.status(400).send({
                status: "FAIL",
                message: "Current refresh token not found in cookies."
            });
        }
        // Find the record for the current session to get its ID
    const currentSession = await prisma.refreshToken.findUnique({
      where: { token: currentRefreshToken }
    });
        if (!currentSession) {
      return reply.status(401).send({ status: "FAIL", message: "Current session is invalid." });
        }
        // Pass the user ID and the current session's UUID to exclude it
        const result = await sessionUseCase.revokeAllOtherSessions(userId, currentSession.id);
        await AuditService.log({
          userId,
          userEmail: email,
          action: "SESSIONS_PURGED",
          entity: "Session",
          entityId: userId,
          ip: request.ip,
          newData: { revokedCount: result.count },
        });
        return reply.send({
      status: "SUCCESS",
      message: `Successfully logged out of ${result.count} other device(s).`,
    });
    } catch (error: any) {
        throw error;
    }
}