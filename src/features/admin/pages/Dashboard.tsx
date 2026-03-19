import { useEffect, useState } from "react";
import DashboardLayout from "../../../shared/components/layout/DashboardLayout";
import { adminApi } from "../api/admin.api";
import type { Stats } from "../api/admin.api";
import { adminLinks } from "../adminLinks";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";
import { UserGroupIcon, UsersIcon, BanknotesIcon, ChartBarIcon, CurrencyDollarIcon } from "@heroicons/react/24/solid";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    const load = async () => {
      const data = await adminApi.getStats();
      setStats(data);
    };
    load();
  }, []);

  if (!stats) return <p>Loading...</p>;

  const cardData = [
    { title: "Users", value: stats.totalUsers, icon: <UserGroupIcon className="w-8 h-8 text-blue-500" /> },
    { title: "Agents", value: stats.totalAgents, icon: <UsersIcon className="w-8 h-8 text-green-500" /> },
    { title: "Billers", value: stats.totalBillers, icon: <BanknotesIcon className="w-8 h-8 text-yellow-500" /> },
    { title: "Transactions", value: stats.totalTransactions, icon: <ChartBarIcon className="w-8 h-8 text-purple-500" /> },
    { title: "Revenue", value: `$${stats.totalRevenue}`, icon: <CurrencyDollarIcon className="w-8 h-8 text-red-500" /> },
  ];

  const chartData = {
    labels: cardData.map((c) => c.title),
    datasets: [
      {
        label: "Overview",
        data: cardData.map((c) => (typeof c.value === "number" ? c.value : parseInt(c.value.replace(/\D/g, "")))),
        backgroundColor: ["#3B82F6", "#10B981", "#F59E0B", "#8B5CF6", "#EF4444"],
      },
    ],
  };

  return (
    <DashboardLayout title="Dashboard Overview" links={adminLinks}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {cardData.map((c) => (
          <div key={c.title} className="bg-white shadow-lg rounded-lg p-6 flex items-center gap-4">
            {c.icon}
            <div>
              <p className="text-gray-500">{c.title}</p>
              <h2 className="text-2xl font-bold">{c.value}</h2>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white shadow-lg rounded-lg p-6">
        <h3 className="font-bold text-lg mb-4">Overview Chart</h3>
        <Bar data={chartData} options={{ responsive: true, plugins: { legend: { position: "bottom" } } }} />
      </div>
    </DashboardLayout>
  );
}