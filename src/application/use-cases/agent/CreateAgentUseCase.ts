import { IAgentRepository } from "../../../domain/repositories/IAgentRepository";


export class CreateAgentUseCase {
    constructor(private agentRepo: IAgentRepository) { }
    
    async execute(input: any, userRole: string) {
        if (userRole !== 'SYSTEM_ADMIN') {
            throw new Error('Unauthorized: only Derash Admins can create Billers');
        }
        input.code = input.code.toUpperCase();
        const existing = await this.agentRepo.findByCode(input.code);
        if (existing) throw new Error('Agent already exists');

        return await this.agentRepo.create(input);
    }
}