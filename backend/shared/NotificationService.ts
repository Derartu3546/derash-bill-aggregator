import { prisma } from '../config/prisma';


export class NotificationService {
    static async sendToAdmins(title: string, message: string, type: string) {
        // 1. Find all Derash Admins
        const admins = await prisma.user.findMany({
          where: { role: "SYSTEM_ADMIN" },
          select: { id: true },
        });

        // 2. Create a notifications for each admin
        const notifications = admins.map(admin => ({
            userId: admin.id,
            title,
            message,
            type,
        }));
        await prisma.notification.createMany({
            data: notifications
        })
    }
}