import { IBillerRepository } from "../../../domain/repositories/IBillerRepository";

export class CreateBillerUseCase {
    constructor(private billerRepo: IBillerRepository) { }
    
    async execute(input: any, userRole: string) {
        if (userRole !== 'SYSTEM_ADMIN') {
            throw new Error('Unauthorized: only Derash Admins can create Billers');
        }
        input.code = input.code.toUpperCase();
        const existing = await this.billerRepo.findByCode(input.code );
        if (existing) throw new Error('Biller already exists');

        return await this.billerRepo.create(input);
    }
}


