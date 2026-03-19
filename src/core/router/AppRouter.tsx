import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppProvider from "../providers/AppProvider"; // make sure the path is correct
import PublicRoutes from "./PublicRoutes";
import AdminRoutes from "./AdminRoutes";
import AgentRoutes from "./AgentRoutes";
import BillerRoutes from "./BillerRoutes";
import LoginPage from "../../features/auth/pages/LoginPage";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <AppProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/admin/*" element={<AdminRoutes />} />
          <Route path="/agent/*" element={<AgentRoutes />} />
          <Route path="/biller/*" element={<BillerRoutes />} />
          <Route path="/*" element={<PublicRoutes />} />
        </Routes>
      </AppProvider>
    </BrowserRouter>
  );
}