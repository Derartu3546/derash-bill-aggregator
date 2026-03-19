// src/core/router/AgentRoutes.tsx
import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "@/shared/components/common/ProtectedRoute";

// Agent Pages
import Dashboard from "../../features/agent/pages/Dashboard";
import PayBill from "@/features/agent/pages/PayBill";
import Transactions from "@/features/agent/pages/Transactions";

export default function AgentRoutes() {
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
        path="pay-bill"
        element={
          <ProtectedRoute>
            <PayBill />
          </ProtectedRoute>
        }
      />

      <Route
        path="transactions"
        element={
          <ProtectedRoute>
            <Transactions />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}