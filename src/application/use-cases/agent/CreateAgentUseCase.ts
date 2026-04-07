import { IAgentRepository } from "../../../domain/repositories/IAgentRepository";


export class CreateAgentUseCase {
    constructor(private agentRepo: IAgentRepository) { }
    
    async execute(input: any, userRole: string) {
        if (userRole !== 'SYSTEM_ADMIN') {
            throw new Error('Unauthorized: only Derash Admins can create Billers');
        }
        input.code = input.code.toUpperCase();
        const existing = await this.agentRepo.findByCode(input.code);
        if (existing) {
          if (existing.isDeleted) {
            return await this.agentRepo.update({
              id: existing.id,
              ...input,
              isDeleted: false,
              deletedAt: null,
              isEnabled:true
            });
          } else {
           throw new Error("A Biller with this code is already active.");
          }
        }

        return await this.agentRepo.create(input);
    }
}