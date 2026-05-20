import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from '../../config/prisma';
import { ApiResponse } from "../../shared/utils/ApiResponse";


export class NotificationController {
    static async getMyNotifications(request: FastifyRequest, reply: FastifyReply) {
        const userId = (request.user as any).id;

        const notifications = await prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 20
        });
        return ApiResponse.success(notifications, "Notifications fetched.");
    }

    static async markAsRead(request: FastifyRequest, reply: FastifyReply) {
        const { id } = request.params as { id: string };

        await prisma.notification.update({
            where: { id },
            data: { isRead: true }
        });
        return ApiResponse.success(null, "Notification marked as read.");
    }
    
}