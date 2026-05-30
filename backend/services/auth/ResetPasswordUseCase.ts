// backend/services/auth/ResetPasswordUseCase.ts
import bcrypt from "bcrypt";
import { IUserRepository } from "../../models/IUserRepository";

export class ResetPasswordUseCase {
  constructor(private userRepo: IUserRepository) {}

  async execute(token: string, newPassword: string) {
    const user = await this.userRepo.findByResetToken(token);
    if (!user) {
      throw new Error("Invalid or expired reset token.");
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // ✅ Prisma requires `null` to clear nullable fields
    await this.userRepo.update(user.id, {
      passwordHash: hashedPassword,
      resetToken: null,
      resetTokenExpires: null,
    });

    return user;
  }
}