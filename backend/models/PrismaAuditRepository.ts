import { prisma } from '../config/prisma';




export class PrismaAuditRepository {
  async createLog(data: any) {
    return await prisma.auditLog.create({
      data: {
        userId: data.userId,
        userEmail: data.userEmail,
        action: data.action,
        entityName: data.entityName,
        entityId: data.entityId,
        oldValues: data.oldValues || {}, // Default to empty JSON if null
        newValues: data.newValues || {},
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    });
  }

  // This is what your GET route uses
  async findAll() {
    return await prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
    });
  }
}
