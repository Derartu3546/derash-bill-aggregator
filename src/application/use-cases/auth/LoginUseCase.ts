import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { prisma } from '../../../infrastructure/database/prisma';


export class LoginUseCase {
    constructor(private useRepo: IUserRepository) { }
    
    async execute(email: string, password: string) {
        //find user
        const user = await prisma.user.findUnique({
            where:{email}
        })
        if (!user) throw new Error('Invalid creadentials');
        const hash = await this.useRepo.getHashByEmail(email);
        const isMatch = await bcrypt.compare(password,user.passwordHash);
        if (!isMatch) throw new Error('Invalid email or password');

        // Generate Token
        const payload = {
          sub: user.id,
          role: user.role,
          agentId: user.agentId,
          billerId: user.billerId,
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET!, {
          expiresIn: "1h",
        });
        return {
            token,
            user: {
                id: user.id,
                email:user.email,
                fullName: user.fullName,
                role:user.role
            }
        }
    }
}