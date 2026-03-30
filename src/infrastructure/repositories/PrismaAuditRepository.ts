import { prisma } from '../../infrastructure/database/prisma';


// export class PrismaAuditRepository {
//   async record(data: {
//     userId?: string;
//     userEmail?: string;
//     action: string;
//     entityName: string;
//     entityId: string;
//     oldValues?: any;
//     status: string;
//     ipAddress?: string;
//     newValues?: any;
//     userAgent?: string;
//   }) {
//       return prisma.auditLog.create({
//           data: {
//               userId: data.userId,
//               userEmail: data.userEmail,
//               action: data.action,
//               entityName: data.entityName,
//               entityId: data.entityId,
//               oldValues: data.oldValues || null,
//               newValues: data.newValues || null,
//               ipAddress: data.ipAddress,
//               userAgent: data.userAgent
//           }
//       });
//     }
//     // For the Admin to view history
//     async getAllLogs(limit = 100) {
//         return prisma.auditLog.findMany({
//             orderBy: { createdAt: 'desc' },
//             take: limit,
//             include: {
//                 user:{select:{fullName:true, role:true}}
//             }
//         });
//     }
// }

export class PrismaAuditRepository {
  // 🛡️ This is the "createLog" method you were missing!
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
