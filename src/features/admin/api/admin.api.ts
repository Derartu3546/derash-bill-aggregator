export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "active" | "disabled";
}

export interface Agent {
  id: string;
  name: string;
  phone: string;
  commission: number;
  status: "active" | "pending" | "suspended";
}

export interface Biller {
  id: string;
  name: string;
  serviceType: string;
  status: "active" | "disabled";
}

export interface Stats {
  totalUsers: number;
  totalAgents: number;
  totalBillers: number;
  totalTransactions: number;
  totalRevenue: number;
}

export interface ReportData {
  name: string;
  totalTransactions: number;
  totalRevenue: number;
}

export const adminApi = {
  async getStats(): Promise<Stats> {
    return {
      totalUsers: 50,
      totalAgents: 10,
      totalBillers: 12,
      totalTransactions: 1200,
      totalRevenue: 50000,
    };
  },

  async getUsers(): Promise<User[]> {
    return [
      { id: "1", name: "Alice", email: "alice@test.com", role: "admin", status: "active" },
      { id: "2", name: "Bob", email: "bob@test.com", role: "agent", status: "disabled" },
    ];
  },

  async getAgents(): Promise<Agent[]> {
    return [
      { id: "1", name: "Awash Bank", phone: "1234567890", commission: 5, status: "active" },
      { id: "2", name: "Berhan Bank", phone: "0987654321", commission: 7, status: "pending" },
      { id: "3", name: "Telebirr", phone: "1234567890", commission: 5, status: "active" },
      { id: "4", name: "CBE", phone: "0987654321", commission: 7, status: "pending" },
    ];
  },

  async getBillers(): Promise<Biller[]> {
    return [
      { id: "1", name: "Federal & Regional tax payers", serviceType: "tax", status: "active" },
      { id: "2", name: "Ethiopian Electric Utility", serviceType: "Electricity", status: "disabled" },
    ];
  },

  async getReports(): Promise<ReportData[]> {
    return [
      { name: "Agents", totalTransactions: 500, totalRevenue: 20000 },
      { name: "Billers", totalTransactions: 700, totalRevenue: 30000 },
    ];
  },
};