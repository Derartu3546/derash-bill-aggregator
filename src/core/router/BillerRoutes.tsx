// src/routes/BillerRoutes.tsx
import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "@/shared/components/common/ProtectedRoute";

// Pages
import Dashboard from "../../features/biller/pages/Dashboard";
import BillsPage from "../../features/biller/pages/BillsPage";
import ReportsPage from "../../features/biller/pages/ReportsPage";
import UploadBillsPage from "../../features/biller/pages/UploadBillsPage";

export default function BillerRoutes() {
  return (
    <Routes>
      {/* Default Biller dashboard at /biller */}
      <Route
        index
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      {/* Other biller pages */}
      <Route
        path="bills"
        element={
          <ProtectedRoute>
            <BillsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="reports"
        element={
          <ProtectedRoute>
            <ReportsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="upload"
        element={
          <ProtectedRoute>
            <UploadBillsPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}