// src/features/admin/pages/ReportsPage.tsx
import { useState, useEffect } from "react";
import DashboardLayout from "../../../shared/components/layout/DashboardLayout";
import { adminLinks } from "../adminLinks";
import { Pie, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from "chart.js";
import * as XLSX from "xlsx";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { useNavigate } from "react-router-dom";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

// ------------------ Types ------------------
interface User { id: string; name: string; email: string; }
interface Biller { id: string; name: string; }
interface Agent { id: string; name: string; }

interface TransactionData {
  derash_ref: string;
  billReference: string;
  customerName: string;
  billerName: string;
  amountDue: number;
  amountPaid: number;
  remainingBal: number;
  status: string;
  paidAt: string;
  agentName: string;
  paymentMethod: string;
  agentShare: number;
  billerShare: number;
  aggregatorShare: number;
}

// ------------------ Mock Data ------------------
const mockUsers: User[] = [
  { id: "1", name: "Super Admin", email: "admin@derash.com" },
  { id: "2", name: "Biller Admin", email: "biller@derash.com" },
];

const mockBillers: Biller[] = [
  { id: "1", name: "Biller A" },
  { id: "2", name: "Biller B" },
];

const mockAgents: Agent[] = [
  { id: "1", name: "Agent 1" },
  { id: "2", name: "Agent 2" },
];

const mockTransactions: TransactionData[] = [
  {
    derash_ref: "TRX001",
    billReference: "BILL1001",
    customerName: "John Doe",
    billerName: "Biller A",
    amountDue: 500,
    amountPaid: 500,
    remainingBal: 0,
    status: "PAID",
    paidAt: "2026-03-17",
    agentName: "Agent 1",
    paymentMethod: "CARD",
    agentShare: 50,
    billerShare: 400,
    aggregatorShare: 50,
  },
  {
    derash_ref: "TRX002",
    billReference: "BILL1002",
    customerName: "Jane Smith",
    billerName: "Biller B",
    amountDue: 1000,
    amountPaid: 600,
    remainingBal: 400,
    status: "PARTIALLY_PAID",
    paidAt: "2026-03-16",
    agentName: "Agent 2",
    paymentMethod: "USSD",
    agentShare: 60,
    billerShare: 480,
    aggregatorShare: 60,
  },
];

// ------------------ Component ------------------
export default function ReportsPage() {
  const [users] = useState(mockUsers);
  const [billers] = useState(mockBillers);
  const [agents] = useState(mockAgents);
  const [transactions] = useState(mockTransactions);

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  // ---------- Admin-only access ----------
  useEffect(() => {
    if (!user || user.role !== "ADMIN") {
      navigate("/"); // redirect non-admins
    }
  }, [user, navigate]);

  // ---------- Filtered transactions ----------
  const filteredTransactions = transactions.filter((t) => {
    const paidDate = new Date(t.paidAt);
    const from = fromDate ? new Date(fromDate) : null;
    const to = toDate ? new Date(toDate) : null;
    if (from && paidDate < from) return false;
    if (to && paidDate > to) return false;
    return true;
  });

  // ---------- Charts ----------
  const revenueByBiller: Record<string, number> = {};
  const transactionsCount: Record<string, number> = {};
  const billStatusCounts: Record<string, number> = {};

  filteredTransactions.forEach((t) => {
    revenueByBiller[t.billerName] = (revenueByBiller[t.billerName] || 0) + t.amountPaid;
    transactionsCount[t.billerName] = (transactionsCount[t.billerName] || 0) + 1;
    billStatusCounts[t.status] = (billStatusCounts[t.status] || 0) + 1;
  });

  const pieData = {
    labels: Object.keys(revenueByBiller),
    datasets: [
      {
        label: "Revenue",
        data: Object.values(revenueByBiller),
        backgroundColor: ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"],
      },
    ],
  };

  const barData = {
    labels: Object.keys(transactionsCount),
    datasets: [
      {
        label: "Transactions",
        data: Object.values(transactionsCount),
        backgroundColor: "#3B82F6",
      },
    ],
  };

  const billStatusData = {
    labels: Object.keys(billStatusCounts),
    datasets: [
      {
        label: "Bill Status",
        data: Object.values(billStatusCounts),
        backgroundColor: ["#34D399", "#F87171", "#FBBF24", "#9CA3AF"],
      },
    ],
  };

  // ---------- Export to Excel ----------
  const exportToExcel = () => {
    const simpleData = filteredTransactions.map((t) => ({
      "Bill Reference": t.billReference,
      Customer: t.customerName,
      Biller: t.billerName,
      "Amount Due": t.amountDue,
      "Amount Paid": t.amountPaid,
      "Remaining Balance": t.remainingBal,
      Status: t.status,
      "Paid Date": t.paidAt,
      "Transaction ID": t.derash_ref,
      Agent: t.agentName,
      "Payment Method": t.paymentMethod,
      "Agent Share": t.agentShare,
      "Biller Share": t.billerShare,
      "Aggregator Share": t.aggregatorShare,
    }));
    const ws = XLSX.utils.json_to_sheet(simpleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Reports");
    XLSX.writeFile(wb, "transactions_report.xlsx");
  };

  return (
    <DashboardLayout title="Reports" links={adminLinks}>

      {/* --------- Date Filter & Export --------- */}
      <div className="mb-6 flex flex-col md:flex-row md:items-end md:gap-4">
        <div>
          <label className="block text-sm font-medium">From:</label>
          <input
            type="date"
            className="border rounded p-2"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium">To:</label>
          <input
            type="date"
            className="border rounded p-2"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </div>
        <div className="mt-2 md:mt-0">
          <button
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
            onClick={exportToExcel}
          >
            Export Reports
          </button>
        </div>
      </div>

      {/* --------- Transactions Table --------- */}
      <div className="bg-white shadow-lg rounded-xl p-4 mb-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3">Bill Reference</th>
              <th>Customer</th>
              <th>Biller</th>
              <th>Amount Due</th>
              <th>Amount Paid</th>
              <th>Remaining</th>
              <th>Status</th>
              <th>Paid Date</th>
              <th>Transaction ID</th>
              <th>Agent</th>
              <th>Payment Method</th>
              <th>Agent Share</th>
              <th>Biller Share</th>
              <th>Aggregator Share</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.map((t) => (
              <tr key={t.derash_ref} className="border-t hover:bg-gray-50 transition">
                <td className="p-3">{t.billReference}</td>
                <td>{t.customerName}</td>
                <td>{t.billerName}</td>
                <td>${t.amountDue}</td>
                <td>${t.amountPaid}</td>
                <td>${t.remainingBal}</td>
                <td>{t.status}</td>
                <td>{t.paidAt}</td>
                <td>{t.derash_ref}</td>
                <td>{t.agentName}</td>
                <td>{t.paymentMethod}</td>
                <td>${t.agentShare}</td>
                <td>${t.billerShare}</td>
                <td>${t.aggregatorShare}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --------- KPI Cards --------- */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white shadow-lg rounded-xl p-6 text-center">
          <h3 className="font-bold mb-2">Total Users</h3>
          <p className="text-3xl font-bold text-blue-600">{users.length}</p>
        </div>
        <div className="bg-white shadow-lg rounded-xl p-6 text-center">
          <h3 className="font-bold mb-2">Total Billers</h3>
          <p className="text-3xl font-bold text-green-600">{billers.length}</p>
        </div>
        <div className="bg-white shadow-lg rounded-xl p-6 text-center">
          <h3 className="font-bold mb-2">Total Agents</h3>
          <p className="text-3xl font-bold text-yellow-500">{agents.length}</p>
        </div>
        <div className="bg-white shadow-lg rounded-xl p-6 text-center">
          <h3 className="font-bold mb-2">Total Revenue</h3>
          <p className="text-3xl font-bold text-purple-600">
            ${filteredTransactions.reduce((sum, t) => sum + t.amountPaid, 0)}
          </p>
        </div>
      </div>

      {/* --------- Charts --------- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-white shadow-lg rounded-xl p-6">
          <h3 className="font-bold mb-4">Revenue by Biller</h3>
          <Pie data={pieData} />
        </div>
        <div className="bg-white shadow-lg rounded-xl p-6">
          <h3 className="font-bold mb-4">Transactions by Biller</h3>
          <Bar data={barData} />
        </div>
        <div className="bg-white shadow-lg rounded-xl p-6">
          <h3 className="font-bold mb-4">Bill Status Breakdown</h3>
          <Pie data={billStatusData} />
        </div>
      </div>

    </DashboardLayout>
  );
}