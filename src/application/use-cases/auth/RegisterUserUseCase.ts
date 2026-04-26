import bcrypt from 'bcrypt';
import { IUserRepository } from '../../../domain/repositories/IUserRepository.ts';
import { UserRole } from '../../../domain/entities/User.ts';

export class RegisterUserUseCase {
    constructor(
        private userRepo: IUserRepository
    ) { }

    async execute(input: any) {
       
        const existing = await this.userRepo.findByEmail(input.email);
        if (existing) throw new Error('User with this email already exists');

        if (input.role === 'BILLER_ADMIN' && !input.biller_id) {
            throw new Error('A Biller Admin must be linked to a Biller ID');
        }
        if (input.role === 'AGENT_USER' && !input.agent_id) {
            throw new Error('An Agent User must be linked to an Agent ID');
        }

        if (!input.password || input.password.length < 6) {
            throw new Error('Password must be at least 6 characters');
        }
        
        const salt = await bcrypt.genSalt(10);
        const hashed_password = await bcrypt.hash(input.password, salt);

        return await this.userRepo.create({
            email: input.email,
            password: hashed_password, // Must be named 'password'
            name: input.name,
            role: input.role as UserRole,
            biller_id: input.biller_id,
            agent_id: input.agent_id
        });
    }
}