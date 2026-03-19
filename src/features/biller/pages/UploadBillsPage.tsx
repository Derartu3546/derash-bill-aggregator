import DashboardLayout from "../../../shared/components/layout/DashboardLayout";
import { useState } from "react";
import {
  HomeIcon,
  BanknotesIcon,
  ChartBarIcon,
  DocumentArrowUpIcon,
} from "@heroicons/react/24/solid";

interface UploadResult {
  success: number;
  failed: number;
  duplicates: number;
}

export default function UploadBillsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<UploadResult | null>(null);

  const billerLinks = [
    { label: "Dashboard", path: "/biller", icon: HomeIcon },
    { label: "Upload Bills", path: "/biller/upload", icon: DocumentArrowUpIcon },
    { label: "Bills", path: "/biller/bills", icon: BanknotesIcon },
    { label: "Reports", path: "/biller/reports", icon: ChartBarIcon },
  ];

  const handleFileChange = (selectedFile: File | null) => {
    setError("");
    setResult(null);

    if (!selectedFile) {
      setFile(null);
      return;
    }

    // ✅ Validate file type (CSV only)
    if (!selectedFile.name.endsWith(".csv")) {
      setError("Only CSV files are allowed.");
      setFile(null);
      return;
    }

    // ✅ Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      setError("File size must be less than 5MB.");
      setFile(null);
      return;
    }

    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file before uploading.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      // 🔄 Replace with real API call later
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Mock result
      setResult({
        success: 95,
        failed: 3,
        duplicates: 2,
      });

      setFile(null);
    } catch (err) {
      setError("Upload failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout title="Upload Bills" links={billerLinks}>
      <div className="bg-white p-6 rounded-xl shadow max-w-xl space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">
            Select CSV File
          </label>

          <input
            type="file"
            accept=".csv"
            className="block w-full border p-2 rounded-lg"
            onChange={(e) =>
              handleFileChange(e.target.files?.[0] || null)
            }
          />

          {file && (
            <p className="text-sm text-gray-500 mt-2">
              Selected file: <strong>{file.name}</strong>
            </p>
          )}

          {error && (
            <p className="text-sm text-red-500 mt-2">{error}</p>
          )}
        </div>

        <button
          onClick={handleUpload}
          disabled={loading}
          className={`px-4 py-2 rounded-lg text-white transition ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-red-500 hover:bg-red-700"
          }`}
        >
          {loading ? "Uploading..." : "Upload Bills"}
        </button>

        {result && (
          <div className="bg-gray-50 border rounded-lg p-4 space-y-2">
            <h3 className="font-semibold text-gray-700">
              Upload Summary
            </h3>
            <p className="text-sm text-green-600">
              Successful: {result.success}
            </p>
            <p className="text-sm text-yellow-600">
              Duplicates: {result.duplicates}
            </p>
            <p className="text-sm text-red-600">
              Failed: {result.failed}
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}