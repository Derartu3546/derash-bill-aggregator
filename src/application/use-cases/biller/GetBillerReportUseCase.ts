export class GetBillerReportUseCase {
  constructor(private billRepo: any) {}

  async execute(billerId: string, fromDate?: string, toDate?: string) {
    const bills = await this.billRepo.findReportData(
      billerId,
      fromDate,
      toDate,
    );

    
    let totalCollected = 0;
    let totalOutstanding = 0;

    const reportRows = bills.map((bill: any) => {
      
      const due = Number(bill.amount || 0);
        let paid = Number(bill.amountPaid || 0); 
        if (bill.status === 'PAID') {
            paid = due;
        }
      
      const remaining = due - paid;

      // 3. Accumulate totals
      totalCollected += paid;
      totalOutstanding += remaining;

      return {
        bill_reference: bill.billReference,
        customer_name: bill.customerName,
        period: bill.period,
        amount_due: due,       
        amount_paid: paid,     // Removed / 100
        remaining_bal: remaining, 
        status: bill.status,
        payment_method: bill.transaction?.[0]?.method || "N/A",
        createdAt: bill.createdAt.toISOString().split("T")[0],
      };
    });

    return {
      summary: {
        totalBills: bills.length,
        totalCollected: Number(totalCollected),
        totalOutstanding: Number(totalOutstanding),
      },
      rows: reportRows,
    };
  }
}
