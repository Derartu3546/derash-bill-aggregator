import { prisma } from '../../config/prisma';

export class SessionManagementUseCase {
    // Get all active sessions for a user
    async getActiveSessions(userId: string) {
        return await prisma.refreshToken.findMany({
          where: { userId },
          select: {
            id: true,
            userAgent: true,
            ipAddress: true,
            createdAt: true,
            expiresAt: true,
          },
          orderBy: { createdAt: "desc" },
        });
    }

    // Revoke a specific session (Remote Logout)
    async revokeSession(userId: string, tokenId: string) {
        const session = await prisma.refreshToken.findUnique({
            where: { id: tokenId }
        });

        if (!session || session.userId !== userId) {
            throw new Error("SESSION_NOT_FOUND");
        }

        return await prisma.refreshToken.delete({
            where: { id: tokenId }
        });
    }
// New Revoke all sessions EXCEPT the active one
    async revokeAllOtherSessions(userId: string, currentTokenId: string) {
        return await prisma.refreshToken.deleteMany({
            where: {
                userId: userId,
                NOT: {
                    id: currentTokenId
                }
            }
        })
    }
}