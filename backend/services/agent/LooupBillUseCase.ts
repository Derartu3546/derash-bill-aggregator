export class LookupBillUseCase {
    constructor(private prisma: any) { }
    

    async execute(billReference: string) {
        const bill = await this.prisma.bill.findFirst({
            where: {
                billReference: billReference,
                status: 'UNPAID'
            },
            include: {
                biller: {
                    select: {
                    name:true, code:true
                }
            } }
        });

        if (!bill) throw new Error("No pending bill found for this reference number it might be already paid or invalid");
        return bill;
    }
}