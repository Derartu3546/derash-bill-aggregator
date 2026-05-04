import bcrypt from 'bcrypt';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';

export class ResetPasswordUseCase {
    constructor(private userRepo: IUserRepository) { }
    

    async execute(token: string, newPassword: string) {
        const user = await this.userRepo.findByResetToken(token);

        if (!user) {
            throw new Error('Invalid or expired reset token.');
        }

        const hashedPassword = await bcrypt.hash(newPassword, 12);


        await this.userRepo.update(user.id, {
          passwordHash: hashedPassword,
            resetToken: undefined,
            resetTokenExpires: undefined
        });
        return user;
    }

}