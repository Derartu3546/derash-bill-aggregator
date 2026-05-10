export class GetBillerBillsUseCase {
    constructor(private billRepo: any) { }
    
    async execute(billerId: string) {
        if (!billerId) throw new Error('Biller ID is required');
        return await this.billRepo.findByBillerId(billerId)
    }
}