// src/features/admin/pages/UsersPage.tsx
import { useEffect, useState } from "react";
import DashboardLayout from "../../../shared/components/layout/DashboardLayout";
import { adminApi } from "../api/admin.api";
import type { User } from "../api/admin.api";
import { adminLinks } from "../adminLinks";
import Modal from "../../../shared/components/Modal";

interface FormState {
  name: string;
  email: string;
  password: string;
  role: string;
  agent_id?: string;
  biller_id?: string;
}
export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    password: "",
    role: "admin",
  });

  useEffect(() => {
    const load = async () => {
      const data = await adminApi.getUsers();
      setUsers(data);
    };
    load();
  }, []);

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase())
  );

  const openAddModal = () => {
    setEditingUser(null);
    setForm({ name: "", email: "", password: "", role: "admin" });
    setIsModalOpen(true);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setForm({ name: user.name, email: user.email, password: "", role: user.role });
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (editingUser) {
      setUsers((prev) =>
        prev.map((u) => (u.id === editingUser.id ? { ...u, ...form } : u))
      );
    } else {
      setUsers((prev) => [
        ...prev,
        { id: Date.now().toString(), status: "active", ...form },
      ]);
    }
    setIsModalOpen(false);
  };

  const toggleStatus = (id: string) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === id
          ? { ...u, status: u.status === "active" ? "disabled" : "active" }
          : u
      )
    );
  };

  const deleteUser = (id: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
  };

  return (
    <DashboardLayout title="Manage Users" links={adminLinks}>
      {/* Search & Add */}
      <div className="flex justify-between mb-4">
        <input
          type="text"
          placeholder="Search users..."
          className="border p-2 rounded-lg w-64"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
          onClick={openAddModal}
        >
          Add User
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white shadow-lg rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3">Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((user) => (
              <tr key={user.id} className="border-t hover:bg-gray-50 transition">
                <td className="p-3">{user.name}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>
                  <span
                    className={`px-2 py-1 rounded-full text-white text-xs ${
                      user.status === "active" ? "bg-green-500" : "bg-red-500"
                    }`}
                  >
                    {user.status}
                  </span>
                </td>
                <td className="flex gap-2">
                  <button
                    className="text-blue-600 hover:underline"
                    onClick={() => openEditModal(user)}
                  >
                    Edit
                  </button>
                  <button
                    className="text-red-600 hover:underline"
                    onClick={() => deleteUser(user.id)}
                  >
                    Delete
                  </button>
                  <button
                    className="text-gray-600 hover:underline"
                    onClick={() => toggleStatus(user.id)}
                  >
                    {user.status === "active" ? "Disable" : "Enable"}
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
  title={editingUser ? "Edit User" : "Add User"}
  onClose={() => setIsModalOpen(false)}
>
  <div className="flex flex-col gap-4">
    {/* Name */}
    <input
      type="text"
      placeholder="Name"
      className="border p-2 rounded-lg w-full"
      value={form.name}
      onChange={(e) => setForm({ ...form, name: e.target.value })}
    />

    {/* Email */}
    <div>
      <input
        type="email"
        placeholder="Email"
        className="border p-2 rounded-lg w-full"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
      />
      {!form.email && (
        <p className="text-red-500 text-sm mt-1">Email is required</p>
      )}
      {form.email &&
        !/^[\w.-]+@[\w.-]+\.\w+$/.test(form.email) && (
          <p className="text-red-500 text-sm mt-1">
            Enter a valid email
          </p>
        )}
    </div>

    {/* Password */}
    <div>
      <input
        type="password"
        placeholder="Password"
        className="border p-2 rounded-lg w-full"
        value={form.password}
        onChange={(e) => setForm({ ...form, password: e.target.value })}
      />
      {!form.password && (
        <p className="text-red-500 text-sm mt-1">
          Password is required
        </p>
      )}
    </div>

    {/* Role */}
    <select
      className="border p-2 rounded-lg w-full"
      value={form.role}
      onChange={(e) =>
        setForm({
          ...form,
          role: e.target.value,
          agent_id: "",
          biller_id: "",
        })
      }
    >
      <option value="ADMIN">Admin</option>
      <option value="AGENT">Agent</option>
      <option value="BILLER">Biller</option>
    </select>

    {/* ✅ Agent ID Field */}
    {form.role === "AGENT" && (
      <div>
        <input
          type="text"
          placeholder="Agent ID"
          className="border p-2 rounded-lg w-full"
          value={form.agent_id || ""}
          onChange={(e) =>
            setForm({ ...form, agent_id: e.target.value })
          }
        />
        {!form.agent_id && (
          <p className="text-red-500 text-sm mt-1">
            Agent ID is required
          </p>
        )}
      </div>
    )}

    {/* ✅ Biller ID Field */}
    {form.role === "BILLER" && (
      <div>
        <input
          type="text"
          placeholder="Biller ID"
          className="border p-2 rounded-lg w-full"
          value={form.biller_id || ""}
          onChange={(e) =>
            setForm({ ...form, biller_id: e.target.value })
          }
        />
        {!form.biller_id && (
          <p className="text-red-500 text-sm mt-1">
            Biller ID is required
          </p>
        )}
      </div>
    )}

    {/* Buttons */}
    <div className="flex justify-end gap-2 mt-2">
      <button
        className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400"
        onClick={() => setIsModalOpen(false)}
      >
        Cancel
      </button>

      <button
        className={`px-4 py-2 text-white rounded-lg ${
          form.email &&
          form.password &&
          /^[\w.-]+@[\w.-]+\.\w+$/.test(form.email) &&
          (form.role !== "AGENT_USER" || form.agent_id) &&
          (form.role !== "BILLER_ADMIN" || form.biller_id)
            ? "bg-red-600 hover:bg-red-700"
            : "bg-gray-400 cursor-not-allowed"
        }`}
        onClick={handleSave}
        disabled={
          !form.email ||
          !form.password ||
          !/^[\w.-]+@[\w.-]+\.\w+$/.test(form.email) ||
          (form.role === "AGENT_USER" && !form.agent_id) ||
          (form.role === "BILLER_ADMIN" && !form.biller_id)
        }
      >
        Save
      </button>
    </div>
  </div>
</Modal> 
    </DashboardLayout>
  );
}