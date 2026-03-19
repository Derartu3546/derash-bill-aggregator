import { useEffect, useState } from "react";
import DashboardLayout from "../../../shared/components/layout/DashboardLayout";
import {
  HomeIcon,
  BanknotesIcon,
  ChartBarIcon,
  DocumentArrowUpIcon,
  CurrencyDollarIcon,
  ClipboardDocumentListIcon,
} from "@heroicons/react/24/solid";

interface BillerStats {
  totalBills: number;
  paidBills: number;
  unpaidBills: number;
  partiallyPaidBills: number;
  revenue: number;
  thisMonthRevenue: number;
}

export default function BillerDashboard() {
  const [stats, setStats] = useState<BillerStats>({
    totalBills: 0,
    paidBills: 0,
    unpaidBills: 0,
    partiallyPaidBills: 0,
    revenue: 0,
    thisMonthRevenue: 0,
  });

  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // 🔄 Replace later with real API call
    setTimeout(() => {
      setStats({
        totalBills: 1200,
        paidBills: 950,
        unpaidBills: 200,
        partiallyPaidBills: 50,
        revenue: 350000,
        thisMonthRevenue: 80000,
      });
      setLoading(false);
    }, 800);
  }, []);

  const collectionRate =
    stats.totalBills > 0
      ? ((stats.paidBills / stats.totalBills) * 100).toFixed(1)
      : "0";

  const billerLinks = [
    { label: "Dashboard", path: "/biller", icon: HomeIcon },
    { label: "Upload Bills", path: "/biller/upload", icon: DocumentArrowUpIcon },
    { label: "Bills", path: "/biller/bills", icon: BanknotesIcon },
    { label: "Reports", path: "/biller/reports", icon: ChartBarIcon },
  ];

  return (
    <DashboardLayout title="Biller Dashboard" links={billerLinks}>
      {loading ? (
        <div className="text-center py-10 text-gray-500">Loading dashboard...</div>
      ) : (
        <div className="space-y-8">
          {/* 🔹 Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatCard
              title="Total Bills"
              value={stats.totalBills}
              icon={<ClipboardDocumentListIcon className="w-6 h-6 text-blue-600" />}
            />

            <StatCard
              title="Paid Bills"
              value={stats.paidBills}
              icon={<CurrencyDollarIcon className="w-6 h-6 text-green-600" />}
            />

            <StatCard
              title="Unpaid Bills"
              value={stats.unpaidBills}
              icon={<BanknotesIcon className="w-6 h-6 text-red-600" />}
            />

            <StatCard
              title="Partially Paid"
              value={stats.partiallyPaidBills}
              icon={<BanknotesIcon className="w-6 h-6 text-yellow-600" />}
            />

            <StatCard
              title="Total Revenue (ETB)"
              value={stats.revenue}
              isCurrency
              icon={<CurrencyDollarIcon className="w-6 h-6 text-emerald-600" />}
            />

            <StatCard
              title="This Month Revenue (ETB)"
              value={stats.thisMonthRevenue}
              isCurrency
              icon={<ChartBarIcon className="w-6 h-6 text-purple-600" />}
            />
          </div>

          {/* 🔹 Performance Section */}
          <div className="bg-white p-6 rounded-xl shadow">
            <h2 className="text-lg font-semibold mb-4">
              Collection Performance
            </h2>

            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600">Collection Rate</span>
              <span className="font-bold text-green-600">
                {collectionRate}%
              </span>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-green-500 h-3 rounded-full transition-all"
                style={{ width: `${collectionRate}%` }}
              />
            </div>
          </div>

          {/* 🔹 Quick Summary */}
          <div className="bg-white p-6 rounded-xl shadow">
            <h2 className="text-lg font-semibold mb-4">Quick Summary</h2>

            <ul className="space-y-2 text-gray-600 text-sm">
              <li>• Total Bills Issued: {stats.totalBills}</li>
              <li>• Successfully Paid Bills: {stats.paidBills}</li>
              <li>• Unpaid Bills: {stats.unpaidBills}</li>
              <li>• Partially Paid Bills: {stats.partiallyPaidBills}</li>
              <li>
                • Total Revenue Collected: ETB{" "}
                {stats.revenue.toLocaleString()}
              </li>
            </ul>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

interface StatCardProps {
  title: string;
  value: number;
  icon?: React.ReactNode;
  isCurrency?: boolean;
}

function StatCard({
  title,
  value,
  icon,
  isCurrency = false,
}: StatCardProps) {
  return (
    <div className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition">
      <div className="flex items-center justify-between">
        <h3 className="text-gray-500 text-sm">{title}</h3>
        {icon}
      </div>

      <p className="text-2xl font-bold mt-2">
        {isCurrency ? `ETB ${value.toLocaleString()}` : value.toLocaleString()}
      </p>
    </div>
  );
}