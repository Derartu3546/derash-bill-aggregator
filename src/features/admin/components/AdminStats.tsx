interface Props {
  stats: {
    totalUsers: number;
    totalAgents: number;
    totalBillers: number;
    totalTransactions: number;
    totalRevenue: number;
  };
}

export default function AdminStats({ stats }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
      <StatCard title="Users" value={stats.totalUsers} />
      <StatCard title="Agents" value={stats.totalAgents} />
      <StatCard title="Billers" value={stats.totalBillers} />
      <StatCard title="Transactions" value={stats.totalTransactions} />
      <StatCard title="Revenue" value={`$${stats.totalRevenue}`} />
    </div>
  );
}

function StatCard({ title, value }: any) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <h3 className="text-gray-500 text-sm">{title}</h3>
      <p className="text-2xl font-bold mt-2">{value}</p>
    </div>
  );
}