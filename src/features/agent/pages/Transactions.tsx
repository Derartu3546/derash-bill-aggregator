import DashboardLayout from "@/shared/components/layout/DashboardLayout";
import { agentLinks } from "../agentLinks";

export default function Transactions() {
  return (
    <DashboardLayout title="Transactions" links={agentLinks}>
      <div className="p-4 bg-white rounded shadow">
        <h2 className="text-xl font-bold mb-4">Transactions Page</h2>
        <p>All your transactions will be listed here. Coming soon!</p>
      </div>
    </DashboardLayout>
  );
}