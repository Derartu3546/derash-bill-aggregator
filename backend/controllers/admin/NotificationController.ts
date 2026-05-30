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

        const billerIds: string[] = [
            ...new Set(
                notifications
                    .map((n) => n.billerId)
                    .filter((id): id is string => id !== null),
            ),
        ];
        const billers = await prisma.biller.findMany({
            where: { id: { in: billerIds } },
        });

        const enriched = notifications.map(n => ({
            ...n,
            biller: billers.find(b => b.id === n.billerId) || { name: 'Unknown', adminEmail: "N/A" }
        }));
        return ApiResponse.success(enriched, "Notifications fetched.");
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