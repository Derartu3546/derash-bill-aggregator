import bcrypt from 'bcrypt';
import { IUserRepository } from '../../../domain/repositories/IUserRepository.ts';

export class LoginUseCase {
  constructor(private userRepo: IUserRepository) { }

  async execute(email: string, password: string) {
  
    const user = await this.userRepo.findByEmail(email); 
    
    if (!user || !user.isActive) {
      throw new Error('Invalid credentials');
    }


    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new Error('Invalid email or password');


    return user;
  }
}