interface Agent {
  id: string;
  name: string;
  phone: string;
  commission: number;
  status: "active" | "pending" | "suspended";
}

interface Props {
  agents: Agent[];
}

export default function AgentTable({ agents }: Props) {
  return (
    <div className="bg-white rounded-xl shadow overflow-x-auto">
      <div className="p-4 border-b font-semibold">Agents</div>

      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-left">
          <tr>
            <th className="p-3">Name</th>
            <th>Phone</th>
            <th>Commission %</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {agents.map((agent) => (
            <tr key={agent.id} className="border-t hover:bg-gray-50">
              <td className="p-3">{agent.name}</td>
              <td>{agent.phone}</td>
              <td>{agent.commission}%</td>
              <td>
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    agent.status === "active"
                      ? "bg-green-100 text-green-600"
                      : agent.status === "pending"
                      ? "bg-yellow-100 text-yellow-600"
                      : "bg-red-100 text-red-600"
                  }`}
                >
                  {agent.status}
                </span>
              </td>
              <td>
                <button className="text-red-600 hover:underline">
                  Suspend
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}