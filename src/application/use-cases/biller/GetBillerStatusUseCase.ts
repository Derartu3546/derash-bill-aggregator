import { cuid } from "zod";
import { IBillerRepository } from "../../../domain/repositories/IBillerRepository.ts";

export class GetBillerStatsUseCase {
    constructor(private billerRepo: any) { }
    
    async execute(biller_id: string, currentUser: any) {
        if (currentUser.role !== 'SUPER_ADMIN' && currentUser.biller_id !== biller_id) {
            throw new Error('Unauthorized: You cannot acccess these financial insights');
        }

        return await this.billerRepo.getBillerStats(biller_id);

    }
}