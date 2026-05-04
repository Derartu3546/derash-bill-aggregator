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
      
      if (!user || user.isDeleted) throw new Error('Invalid creadentials');
      if (user.status !== 'active') {
         throw new Error(
           "Your account is disabled. Please contact the administrator.",
         );
      }

      if (user.billerId) {
        const biller = await prisma.biller.findUnique({ where: { id: user.billerId } });
        if (!biller || biller.isDeleted) {
          throw new Error("Your organization account has been deactivated.");
        }
      }
        if (user.agentId) {
          const agent = await prisma.agent.findUnique({ where: { id: user.agentId } });
          if (!agent || agent.isDeleted) {
            throw new Error("Your Agent account has been deactivated");
          }
        }
      
        // const hash = await this.useRepo.getHashByEmail(email);
        const isMatch = await bcrypt.compare(password,user.passwordHash);
      if (!isMatch) throw new Error('Invalid email or password');
      if (user.mustChangePassword) {
        const tempToken = jwt.sign(
          {
            id: user.id,
            role: user.role,
            onboarding: true
          },
          process.env.JWT_SECRET!,
          { expiresIn: '10m' }
        );

        return {
          mustChangePassword: true,
          tempToken,
          user: {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            role: user.role,
          },
          message: 'Password change required before accessing the system'
        };
      }

      
        const accessToken = jwt.sign({ id: user.id, role: user.role , billerId: user.billerId, agentId: user.agentId}, process.env.JWT_SECRET!, { expiresIn: '15m' });
        const refreshToken = crypto.randomBytes(40).toString('hex');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        await this.useRepo.saveRefreshToken(user.id, refreshToken, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));

      return {
          mustChangePassword:false,
          accessToken,
          refreshToken,
          user: {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            role: user.role,
          },
        };
    }
}