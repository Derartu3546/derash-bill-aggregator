import { useState } from "react";
import DashboardLayout from "@/shared/components/layout/DashboardLayout";
import { agentLinks } from "../agentLinks";
import { format } from "date-fns";

// ------------------ Mock Data ------------------
interface Transaction {
  id: string;
  billReference: string;
  customerName: string;
  amountPaid: number;
  status: "PAID" | "PARTIALLY_PAID" | "PENDING";
  paidAt: string;
}

const mockTransactions: Transaction[] = [
  { id: "TRX001", billReference: "BILL1001", customerName: "John Doe", amountPaid: 500, status: "PAID", paidAt: "2026-03-16" },
  { id: "TRX002", billReference: "BILL1002", customerName: "Jane Smith", amountPaid: 600, status: "PARTIALLY_PAID", paidAt: "2026-03-17" },
  { id: "TRX003", billReference: "BILL1003", customerName: "Bob Johnson", amountPaid: 0, status: "PENDING", paidAt: "2026-03-17" },
];

// ------------------ Component ------------------
export default function Dashboard() {
  const [transactions] = useState(mockTransactions);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Filter transactions by date
  const filteredTransactions = transactions.filter((t) => {
    const paidDate = new Date(t.paidAt);
    const from = startDate ? new Date(startDate) : null;
    const to = endDate ? new Date(endDate) : null;

    if (from && paidDate < from) return false;
    if (to && paidDate > to) return false;
    return true;
  });

  const totalAmount = filteredTransactions.reduce((sum, t) => sum + t.amountPaid, 0);

  return (
    <DashboardLayout title="Agent Dashboard" links={agentLinks}>
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <h3 className="font-bold mb-2">Total Transactions</h3>
          <p className="text-3xl font-bold text-blue-600">{filteredTransactions.length}</p>
        </div>
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <h3 className="font-bold mb-2">Total Amount Paid</h3>
          <p className="text-3xl font-bold text-green-600">${totalAmount}</p>
        </div>
      </div>

      {/* Filter by Date */}
      <div className="flex gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium mb-1">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border p-2 rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border p-2 rounded"
          />
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white shadow rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 text-left">Bill Reference</th>
              <th>Customer</th>
              <th>Amount Paid</th>
              <th>Status</th>
              <th>Paid Date</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.map((t) => (
              <tr key={t.id} className="border-t hover:bg-gray-50 transition">
                <td className="p-3">{t.billReference}</td>
                <td>{t.customerName}</td>
                <td>${t.amountPaid}</td>
                <td>
                  <span
                    className={`px-2 py-1 rounded-full text-xs text-white ${
                      t.status === "PAID"
                        ? "bg-green-500"
                        : t.status === "PARTIALLY_PAID"
                        ? "bg-yellow-500"
                        : "bg-gray-500"
                    }`}
                  >
                    {t.status}
                  </span>
                </td>
                <td>{format(new Date(t.paidAt), "yyyy-MM-dd")}</td>
              </tr>
            ))}
            {filteredTransactions.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-4 text-gray-500">
                  No transactions found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}
