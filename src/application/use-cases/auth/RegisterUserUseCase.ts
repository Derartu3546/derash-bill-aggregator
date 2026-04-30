import bcrypt from 'bcrypt';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { UserRole } from '../../../domain/entities/User';

export class RegisterUserUseCase {
    constructor(
        private userRepo: IUserRepository
    )
    { }
    async execute(input: any) {
        const existing = await this.userRepo.findByEmail(input.email);
        if (existing) {
            if (existing.isDeleted) {
                const salt = await bcrypt.genSalt(10);
                const passwordHash = await bcrypt.hash(input.password, salt);
                return await this.userRepo.update(existing.id, {
                  ...input,
                  passwordHash,
                  isDeleted: false,
                  status: "active",
                  mustChangePassword: true,
                });
            } else {
                throw new Error("User already exists and is currently active");
            }
        }

        if (input.role === 'BILLER_USER' && !input.billerId) {
            throw new Error('A biller User must be linked to a Biller ID');
        }
        if (input.role === 'AGENT_USER' && !input.agentId) {
            throw new Error('An Agent User must be linked to an Agent ID');
        }
        // Hash Password
        if (input.password.length < 6) {
            throw new Error('Password must be at least 6 characters')
        }
        
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(input.password, salt);

        // Save to DB

        return await this.userRepo.create({
          ...input,
          passwordHash,
          mustChangePassword: true,
        });
    }
}