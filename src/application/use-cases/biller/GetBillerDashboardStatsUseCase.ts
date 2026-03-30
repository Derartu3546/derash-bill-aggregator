export class GetBillerDashboardStatsUseCase {
  constructor(private billRepo: any) {}

  async execute(billerId: string) {
    const raw = await this.billRepo.getBillerStats(billerId);

    // Map counts
    const statsMap: any = { PAID: 0, UNPAID: 0, PARTIALLY_PAID: 0 };
    raw.counts.forEach((item: any) => {
      statsMap[item.status] = item._count;
    });

    const totalBills = Object.values(statsMap).reduce(
      (a: any, b: any) => a + b,
      0,
    ) as number;

    return {
      totalBills,
      paidBills: statsMap.PAID || 0,
      unpaidBills: statsMap.UNPAID || 0,
      partiallyPaidBills: statsMap.PARTIALLY_PAID || 0,
      revenue: Number(raw.revenueData._sum.amountPaid || 0),
      thisMonthRevenue: Number(raw.monthlyRevenueData._sum.amountPaid || 0),
    };
  }
}
