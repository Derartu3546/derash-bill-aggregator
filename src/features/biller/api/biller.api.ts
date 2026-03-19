export interface BillerStats {
  totalBills: number;
  paidBills: number;
  unpaidBills: number;
  totalRevenue: number;
}

export interface Bill {
  id: string;
  customerName: string;
  amount: number;
  status: "paid" | "unpaid" | "failed";
  date: string;
}

export interface ReportData {
  month: string;
  revenue: number;
}

export interface NotificationLog {
  id: string;
  type: "SMS" | "Email";
  message: string;
  status: "sent" | "failed";
  date: string;
}

export const billerApi = {
  async getStats(): Promise<BillerStats> {
    return {
      totalBills: 1200,
      paidBills: 950,
      unpaidBills: 200,
      totalRevenue: 350000,
    };
  },

  async getBills(): Promise<Bill[]> {
    return [
      {
        id: "1",
        customerName: "John Doe",
        amount: 1200,
        status: "paid",
        date: "2026-03-01",
      },
      {
        id: "2",
        customerName: "Jane Smith",
        amount: 800,
        status: "unpaid",
        date: "2026-03-02",
      },
    ];
  },

  async getReports(): Promise<ReportData[]> {
    return [
      { month: "Jan", revenue: 50000 },
      { month: "Feb", revenue: 70000 },
      { month: "Mar", revenue: 90000 },
    ];
  },

  async getNotifications(): Promise<NotificationLog[]> {
    return [
      {
        id: "1",
        type: "SMS",
        message: "Bill reminder sent",
        status: "sent",
        date: "2026-03-01",
      },
    ];
  },
};