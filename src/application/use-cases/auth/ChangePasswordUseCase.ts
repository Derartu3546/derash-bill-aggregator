import bcrypt from 'bcrypt';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';

export class ChangePasswordUseCase {
  constructor(private useRepo: IUserRepository) {}

    async execute(userId: string, newPassword: string) {
      
        if (newPassword.length < 6) {
            throw new Error('New password must be at least 6 characters');
        }
    // 1 Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

        await this.useRepo.update(userId, {
          passwordHash: hashedPassword,
          mustChangePassword: false
        });

    return {
      success: true,
      message:
        "Password updated successfully, You can now access your dashboard.",
    };
  }
}