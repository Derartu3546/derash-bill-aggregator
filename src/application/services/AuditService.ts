import { prisma } from '../../infrastructure/database/prisma';

export class AuditService {
    static async log(params: {
        userId: string;
        action: string;
        entity: string;
        entityId: string;
        oldData?: any;
        newData?: any;
        ip?: string;
    }) {
        await prisma.auditLog.create({
            data: {
                userId: params.userId,
                action: params.action,
                entityName: params.entity,
                entityId: params.entityId,
                oldValues: params.oldData || {},
                newValues: params.newData || {},
                ipAddress: params.ip || '0.0.0.0'
            }
        });
    }
}