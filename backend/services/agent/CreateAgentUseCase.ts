import { IAgentRepository } from "../../models/IAgentRepository";
import { Agent } from "../../models/Agent"; // Ensure this path is correct

export class CreateAgentUseCase {
  constructor(private agentRepo: IAgentRepository) {}

  async execute(input: any, userRole: string) {
    if (userRole !== "SYSTEM_ADMIN") {
      throw new Error("Unauthorized: Only Derash Admins can create Agents.");
    }

    input.code = input.code.toUpperCase();
    const existing = await this.agentRepo.findByCode(input.code);

    if (existing) {
      if (existing.isDeleted) {
        const reactivatedAgent = new Agent(
          existing.id,
          input.name || existing.name,
          existing.code,
          input.apiKey || input.api_key || existing.apiKey,
          true,  // isActive
          true,  // isEnabled
          false  // isDeleted
        );

        return await this.agentRepo.update(reactivatedAgent);
      } else {
        throw new Error("An Agent with this code is already active.");
      }
    }

    // 🔑 THE FIX: Instantiate a full Agent entity for creation to satisfy the 'Agent' type contract
    const newAgentEntity = new Agent(
      "", // Pass an empty string or dummy value; your Prisma repository handles auto-generating the UUID
      input.name,
      input.code,
      input.apiKey || input.api_key,
      input.isActive ?? true,
      input.isEnabled ?? true,
      false // isDeleted
    );

    // Now TypeScript is perfectly happy passing it to your repository!
    return await this.agentRepo.create(newAgentEntity);
  }
}