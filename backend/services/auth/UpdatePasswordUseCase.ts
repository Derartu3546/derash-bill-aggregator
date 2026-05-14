import { prisma } from '../../config/prisma';
import bcrypt from 'bcrypt';
import { AuditService } from '../AuditService';

export class UpdatePasswordUseCase{
    async execute(
        userId: string,
        email: string,
        data: { currentPassword: string; newPassword: string },
        meta: { ip: string;  userAgent?: string}
    ) {
        // ! Fetch the user to verify their current password hash
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new Error('USER_NOT_FOUND');
        }

        // 2 Verify their current password before allowing a change 
        const isPasswordValid = await bcrypt.compare(data.currentPassword, user.passwordHash);
        if (!isPasswordValid) {
            throw new Error("INVALID_CURRENT_PASSWORD");
        }
        // 3. Prevent them from reusing the exact same password
        if (data.currentPassword === data.newPassword) {
            throw new Error("SAME_PASSWORD");
        }
        // 4. Hash the new password securely
        const saltRounds = 10;
        const newPasswordHash = await bcrypt.hash(data.newPassword, saltRounds);

        // 5 Save changes and log the security audit atomatically
        return await prisma.$transaction(async (tx) => {
            const updatedUser = await tx.user.update({
                where: { id: userId },
                data: {
                    passwordHash: newPasswordHash,
                    mustChangePassword: false,
                },
            });
            // await tx.refreshToken.deleteMany({
            //   where: { userId, NOT: { token: currentToken } },
            // });
            
            //Audit Log
            await AuditService.log({
                userId,
                userEmail: email,
                action: "UPDATE_PASSWORD_FROM_SETTINGS",
                entity: "User",
                entityId: userId,
                oldData: null,
                newData: { message: "User voluntarily updated their password from settings dashboard" },
                ip: meta.ip,
            });
            return updatedUser;
        });
    }
}