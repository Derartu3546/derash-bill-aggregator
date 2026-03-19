interface Biller {
  id: string;
  name: string;
  serviceType: string;
  status: "active" | "inactive";
}

interface Props {
  billers: Biller[];
}

export default function BillerTable({ billers }: Props) {
  return (
    <div className="bg-white rounded-xl shadow overflow-x-auto">
      <div className="p-4 border-b font-semibold">Billers</div>

      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-left">
          <tr>
            <th className="p-3">Name</th>
            <th>Service</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {billers.map((biller) => (
            <tr key={biller.id} className="border-t hover:bg-gray-50">
              <td className="p-3">{biller.name}</td>
              <td>{biller.serviceType}</td>
              <td>
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    biller.status === "active"
                      ? "bg-green-100 text-green-600"
                      : "bg-red-100 text-red-600"
                  }`}
                >
                  {biller.status}
                </span>
              </td>
              <td>
                <button className="text-blue-600 hover:underline">
                  Edit
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}