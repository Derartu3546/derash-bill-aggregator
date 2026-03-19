// src/routes/AdminRoutes.tsx
import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "@/shared/components/common/ProtectedRoute";

// Pages
import Dashboard from "../../features/admin/pages/Dashboard";
import UsersPage from "../../features/admin/pages/UsersPage";
import AgentsPage from "../../features/admin/pages/AgentsPage";
import BillersPage from "../../features/admin/pages/BillersPage";
import ReportsPage from "../../features/admin/pages/ReportsPage";

export default function AdminRoutes() {
  return (
    <Routes>
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

      <Route
        path="users"
        element={
          <ProtectedRoute>
            <UsersPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="agents"
        element={
          <ProtectedRoute>
            <AgentsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="billers"
        element={
          <ProtectedRoute>
            <BillersPage />
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
    </Routes>
  );
}