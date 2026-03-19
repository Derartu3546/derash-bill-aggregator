import DashboardLayout from "@/shared/components/layout/DashboardLayout";
import { agentLinks } from "../agentLinks";

export default function PayBill() {
  return (
    <DashboardLayout title="Pay Bill" links={agentLinks}>
      <div className="p-4 bg-white rounded shadow">
        <h2 className="text-xl font-bold mb-4">Pay Bill Page</h2>
        <p>This page will allow agents to pay bills. Coming soon!</p>
      </div>
    </DashboardLayout>
  );
}