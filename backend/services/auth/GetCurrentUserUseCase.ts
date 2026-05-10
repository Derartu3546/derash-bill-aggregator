import { IUserRepository } from "../../models/IUserRepository";

export class GetCurrentUserUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new Error("User session not found");

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      billerId: user.billerId,
      agentId: user.agentId,
    };
  }
}
