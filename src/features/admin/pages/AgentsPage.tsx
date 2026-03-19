// src/features/admin/pages/AgentsPage.tsx
import { useState } from "react";
import DashboardLayout from "../../../shared/components/layout/DashboardLayout";
import { adminLinks } from "../adminLinks";
import Modal from "../../../shared/components/Modal";

// Local Agent type (since no backend yet)
interface Agent {
  id: string;
  name: string;
  code: string;
  api_key?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([
    {
      id: "1",
      name: "Abel Telecom",
      code: "ABL001",
      api_key: "key_12345",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "2",
      name: "Zemen Utilities",
      code: "ZEM002",
      api_key: "",
      isActive: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);

  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);

  const [form, setForm] = useState({
    name: "",
    code: "",
    api_key: "",
    isActive: true,
  });

  // Filter agents
  const filteredAgents = agents.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.code.toLowerCase().includes(search.toLowerCase())
  );

  // Open Add Modal
  const openAddModal = () => {
    setEditingAgent(null);
    setForm({ name: "", code: "", api_key: "", isActive: true });
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (agent: Agent) => {
    setEditingAgent(agent);
    setForm({
      name: agent.name,
      code: agent.code,
      api_key: agent.api_key || "",
      isActive: agent.isActive,
    });
    setIsModalOpen(true);
  };

  // Save Agent
  const handleSave = () => {
    if (!form.name || !form.code) {
      alert("Name and Code are required");
      return;
    }

    if (editingAgent) {
      // Update
      setAgents((prev) =>
        prev.map((a) =>
          a.id === editingAgent.id
            ? { ...a, ...form, updatedAt: new Date() }
            : a
        )
      );
    } else {
      // Create
      const newAgent: Agent = {
        id: Date.now().toString(),
        ...form,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setAgents((prev) => [...prev, newAgent]);
    }

    setIsModalOpen(false);
  };

  // Toggle Status
  const toggleStatus = (id: string) => {
    setAgents((prev) =>
      prev.map((a) =>
        a.id === id
          ? { ...a, isActive: !a.isActive, updatedAt: new Date() }
          : a
      )
    );
  };

  // Delete
  const deleteAgent = (id: string) => {
    setAgents((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <DashboardLayout title="Manage Agents" links={adminLinks}>
      {/* Top Section */}
      <div className="flex justify-between mb-4">
        <input
          type="text"
          placeholder="Search by name or code..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border p-2 rounded-lg w-64"
        />
        <button
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
          onClick={openAddModal}
        >
          Add Agent
        </button>
      </div>

      {/* Table */}
      <div className="bg-white shadow-lg rounded-xl overflow-x-auto">
        <table className="w-full text-sm border">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-3 border">Name</th>
              <th className="border">Code</th>
              <th className="border">API Key</th>
              <th className="border">Status</th>
              <th className="border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAgents.map((agent) => (
              <tr key={agent.id} className="border-t text-center">
                <td className="p-3 border">{agent.name}</td>
                <td className="border">{agent.code}</td>
                <td className="border">
                  {agent.api_key ? agent.api_key : "-"}
                </td>
                <td className="border">
                  <span
                    className={`px-2 py-1 rounded-full text-xs text-white ${
                      agent.isActive ? "bg-green-500" : "bg-red-500"
                    }`}
                  >
                    {agent.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="border space-x-2 p-2">
                  <button
                    className="text-blue-600 hover:underline"
                    onClick={() => openEditModal(agent)}
                  >
                    Edit
                  </button>
                  <button
                    className="text-red-600 hover:underline"
                    onClick={() => deleteAgent(agent.id)}
                  >
                    Delete
                  </button>
                  <button
                    className="text-gray-600 hover:underline"
                    onClick={() => toggleStatus(agent.id)}
                  >
                    {agent.isActive ? "Disable" : "Enable"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        title={editingAgent ? "Edit Agent" : "Add Agent"}
        onClose={() => setIsModalOpen(false)}
      >
        <div className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Agent Name"
            className="border p-2 rounded-lg"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />

          <input
            type="text"
            placeholder="Agent Code"
            className="border p-2 rounded-lg"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
          />

          <input
            type="text"
            placeholder="API Key (optional)"
            className="border p-2 rounded-lg"
            value={form.api_key}
            onChange={(e) => setForm({ ...form, api_key: e.target.value })}
          />

          <div className="flex items-center gap-2">
            <label>Active:</label>
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) =>
                setForm({ ...form, isActive: e.target.checked })
              }
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              className="px-4 py-2 bg-gray-300 rounded-lg"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              onClick={handleSave}
            >
              Save
            </button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}