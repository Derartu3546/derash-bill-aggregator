// src/features/admin/pages/BillersPage.tsx

import { useEffect, useState } from "react";
import DashboardLayout from "../../../shared/components/layout/DashboardLayout";
import { adminLinks } from "../adminLinks";
import Modal from "../../../shared/components/Modal";


// ✅ Updated Biller type (matches Prisma)
export interface Biller {
  id: string;
  name: string;
  code: string;
  category: string;
  allowsPartial: boolean;
  apiEndPoint?: string;
  isActive: boolean;
}

export default function BillersPage() {
  const [billers, setBillers] = useState<Biller[]>([]);
  const [search, setSearch] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBiller, setEditingBiller] = useState<Biller | null>(null);

  // ✅ Updated form
  const [form, setForm] = useState({
    name: "",
    code: "",
    category: "",
    allowsPartial: false,
    apiEndPoint: "",
  });

  // ✅ Mock initial data (replace later with API)
  useEffect(() => {
    setBillers([
      {
        id: "1",
        name: "Ethiopian Electric Utility",
        code: "EEU",
        category: "UTILITY",
        allowsPartial: false,
        isActive: true,
      },
      {
        id: "2",
        name: "Federal Revenue",
        code: "FR",
        category: "TAX",
        allowsPartial: true,
        isActive: false,
      },
    ]);
  }, []);

  // ✅ Search filter
  const filtered = billers.filter(
    (b) =>
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.code.toLowerCase().includes(search.toLowerCase()) ||
      b.category.toLowerCase().includes(search.toLowerCase())
  );

  // ✅ Open Add
  const openAddModal = () => {
    setEditingBiller(null);
    setForm({
      name: "",
      code: "",
      category: "",
      allowsPartial: false,
      apiEndPoint: "",
    });
    setIsModalOpen(true);
  };

  // ✅ Open Edit
  const openEditModal = (biller: Biller) => {
    setEditingBiller(biller);
    setForm({
      name: biller.name,
      code: biller.code,
      category: biller.category,
      allowsPartial: biller.allowsPartial,
      apiEndPoint: biller.apiEndPoint || "",
    });
    setIsModalOpen(true);
  };

  // ✅ Save (mock)
  const handleSave = () => {
    if (editingBiller) {
      setBillers((prev) =>
        prev.map((b) =>
          b.id === editingBiller.id ? { ...b, ...form } : b
        )
      );
    } else {
      setBillers((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          isActive: true,
          ...form,
        },
      ]);
    }

    setIsModalOpen(false);
  };

  // ✅ Toggle active
  const toggleStatus = (id: string) => {
    setBillers((prev) =>
      prev.map((b) =>
        b.id === id ? { ...b, isActive: !b.isActive } : b
      )
    );
  };

  // ✅ Delete
  const deleteBiller = (id: string) => {
    setBillers((prev) => prev.filter((b) => b.id !== id));
  };

 
  return (
    <DashboardLayout title="Manage Billers" links={adminLinks}>
      {/* Top Bar */}
      <div className="flex justify-between mb-4">
        <input
          type="text"
          placeholder="Search billers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border p-2 rounded-lg w-64"
        />

        <div className="flex gap-2">
          

          <button
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
            onClick={openAddModal}
          >
            Add Biller
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white shadow-lg rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3">Name</th>
              <th>Code</th>
              <th>Category</th>
              <th>Partial</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((biller) => (
              <tr key={biller.id} className="border-t hover:bg-gray-50">
                <td className="p-3">{biller.name}</td>
                <td>{biller.code}</td>
                <td>{biller.category}</td>
                <td>{biller.allowsPartial ? "Yes" : "No"}</td>

                <td>
                  <span
                    className={`px-2 py-1 rounded-full text-xs text-white ${
                      biller.isActive ? "bg-green-500" : "bg-red-500"
                    }`}
                  >
                    {biller.isActive ? "active" : "disabled"}
                  </span>
                </td>

                <td className="flex gap-2">
                  <button
                    className="text-blue-600 hover:underline"
                    onClick={() => openEditModal(biller)}
                  >
                    Edit
                  </button>

                  <button
                    className="text-red-600 hover:underline"
                    onClick={() => deleteBiller(biller.id)}
                  >
                    Delete
                  </button>

                  <button
                    className="text-gray-600 hover:underline"
                    onClick={() => toggleStatus(biller.id)}
                  >
                    {biller.isActive ? "Disable" : "Enable"}
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
        title={editingBiller ? "Edit Biller" : "Add Biller"}
        onClose={() => setIsModalOpen(false)}
      >
        <div className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Biller Name"
            className="border p-2 rounded-lg"
            value={form.name}
            onChange={(e) =>
              setForm({ ...form, name: e.target.value })
            }
          />

          <input
            type="text"
            placeholder="Code (e.g. EEU)"
            className="border p-2 rounded-lg"
            value={form.code}
            onChange={(e) =>
              setForm({ ...form, code: e.target.value })
            }
          />

          <input
            type="text"
            placeholder="Category"
            className="border p-2 rounded-lg"
            value={form.category}
            onChange={(e) =>
              setForm({ ...form, category: e.target.value })
            }
          />

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.allowsPartial}
              onChange={(e) =>
                setForm({
                  ...form,
                  allowsPartial: e.target.checked,
                })
              }
            />
            Allows Partial Payment
          </label>

          
          <div className="flex justify-end gap-2">
            <button
              className="px-4 py-2 bg-gray-300 rounded-lg"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </button>

            <button
              className="px-4 py-2 bg-blue-600 text-white rounded-lg"
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