import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { prisma } from '../../../infrastructure/database/prisma';
import crypto from 'crypto';


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

        const accessToken = jwt.sign({ id: user.id, role: user.role , billerId: user.billerId, agentId: user.agentId}, process.env.JWT_SECRET!, { expiresIn: '15m' });
        const refreshToken = crypto.randomBytes(40).toString('hex');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        await this.useRepo.saveRefreshToken(user.id, refreshToken, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));

        return {
          accessToken,
          refreshToken,
          user: {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            role: user.role,
          },
        };

        // // Generate Token
        // const payload = {
        //   sub: user.id,
        //   role: user.role,
        //   agentId: user.agentId,
        //   billerId: user.billerId,
        // };

        // const token = jwt.sign(payload, process.env.JWT_SECRET!, {
        //   expiresIn: "1h",
        // });
        // return {
        //     token,
        // }
    }
}