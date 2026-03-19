import { useEffect, useState } from "react";
import DashboardLayout from "../../../shared/components/layout/DashboardLayout";
import Table, { type TableColumn } from "../../../shared/components/ui/Table";
import {
  HomeIcon,
  BanknotesIcon,
  ChartBarIcon,
  DocumentArrowUpIcon,
} from "@heroicons/react/24/solid";
import * as XLSX from "xlsx";

interface ReportRow {
  bill_reference: string;
  customer_name: string;
  period: string;
  amount_due: number;
  amount_paid: number;
  remaining_bal: number;
  status: string;
  payment_method: string;
  createdAt: string;
}

interface Summary {
  totalCollected: number;
  totalOutstanding: number;
  totalBills: number;
}

export default function ReportsPage() {
  const [data, setData] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<Summary>({
    totalCollected: 0,
    totalOutstanding: 0,
    totalBills: 0,
  });

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const billerLinks = [
    { label: "Dashboard", path: "/biller", icon: HomeIcon },
    { label: "Upload Bills", path: "/biller/upload", icon: DocumentArrowUpIcon },
    { label: "Bills", path: "/biller/bills", icon: BanknotesIcon },
    { label: "Reports", path: "/biller/reports", icon: ChartBarIcon },
  ];

  useEffect(() => {
    // 🔄 Replace with real API call later
    setTimeout(() => {
      const mockData: ReportRow[] = [
        {
          bill_reference: "AAWSA-1001",
          customer_name: "Abel Tesfaye",
          period: "Jan 2026",
          amount_due: 1200,
          amount_paid: 1200,
          remaining_bal: 0,
          status: "PAID",
          payment_method: "CASH",
          createdAt: "2026-01-01",
        },
        {
          bill_reference: "AAWSA-1002",
          customer_name: "Meron Bekele",
          period: "Jan 2026",
          amount_due: 900,
          amount_paid: 300,
          remaining_bal: 600,
          status: "PARTIALLY_PAID",
          payment_method: "BANK_TRANSFER",
          createdAt: "2026-01-02",
        },
      ];

      setData(mockData);

      setSummary({
        totalBills: mockData.length,
        totalCollected: mockData.reduce(
          (sum, row) => sum + row.amount_paid,
          0
        ),
        totalOutstanding: mockData.reduce(
          (sum, row) => sum + row.remaining_bal,
          0
        ),
      });

      setLoading(false);
    }, 800);
  }, []);

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Reports");

    // ✅ Direct browser download (no file-saver needed)
    XLSX.writeFile(workbook, "Derash_Report.xlsx");
  };

  const columns: TableColumn<ReportRow>[] = [
    { header: "Bill Ref", accessor: "bill_reference" },
    { header: "Customer", accessor: "customer_name" },
    { header: "Period", accessor: "period" },
    {
      header: "Amount Due",
      accessor: "amount_due",
      render: (row) => `ETB ${row.amount_due.toLocaleString()}`,
    },
    {
      header: "Amount Paid",
      accessor: "amount_paid",
      render: (row) => `ETB ${row.amount_paid.toLocaleString()}`,
    },
    {
      header: "Remaining",
      accessor: "remaining_bal",
      render: (row) => `ETB ${row.remaining_bal.toLocaleString()}`,
    },
    { header: "Status", accessor: "status" },
    { header: "Payment Method", accessor: "payment_method" },
    { header: "Date", accessor: "createdAt" },
  ];

  return (
    <DashboardLayout title="Reports & Analytics" links={billerLinks}>
      <div className="space-y-8">
        {/* Date Filter + Export */}
        <div className="bg-white p-6 rounded-xl shadow flex flex-col md:flex-row gap-4 md:items-end">
          <div>
            <label className="block text-sm text-gray-600 mb-1">From</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="border p-2 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">To</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="border p-2 rounded-lg"
            />
          </div>

          <button className="bg-red-500 hover:bg-red-700 text-white px-4 py-2 rounded-lg">
            Apply Filter
          </button>

          <button
            onClick={exportToExcel}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg md:ml-auto"
          >
            Download Excel
          </button>
        </div>

        {loading ? (
          <div className="text-center py-10 text-gray-500">
            Loading reports...
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <SummaryCard
                title="Total Bills"
                value={summary.totalBills}
              />
              <SummaryCard
                title="Total Collected (ETB)"
                value={summary.totalCollected}
                isCurrency
              />
              <SummaryCard
                title="Total Outstanding (ETB)"
                value={summary.totalOutstanding}
                isCurrency
              />
            </div>
            

            {/* Reports Table */}
            <div className="bg-white p-6 rounded-xl shadow">
              <Table columns={columns} data={data} />
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

function SummaryCard({
  title,
  value,
  isCurrency = false,
}: {
  title: string;
  value: number;
  isCurrency?: boolean;
}) {
  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <h3 className="text-sm text-gray-500">{title}</h3>
      <p className="text-2xl font-bold mt-2">
        {isCurrency ? `ETB ${value.toLocaleString()}` : value}
      </p>
    </div>
  );
}