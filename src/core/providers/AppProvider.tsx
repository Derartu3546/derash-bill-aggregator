import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/features/auth/store/auth.store";

interface AppProviderProps {
  children: ReactNode;
}

const AUTO_LOGOUT_MINUTES = 2;
const WARNING_MINUTES = 1;

export default function AppProvider({ children }: AppProviderProps) {
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const [warningVisible, setWarningVisible] = useState(false);

  useEffect(() => {
    let logoutTimer: number;
    let warningTimer: number;

    const resetTimers = () => {
      if (logoutTimer) clearTimeout(logoutTimer);
      if (warningTimer) clearTimeout(warningTimer);
      setWarningVisible(false);

      // Warning 1 minute before logout
      warningTimer = window.setTimeout(() => {
        setWarningVisible(true);
      }, (AUTO_LOGOUT_MINUTES - WARNING_MINUTES) * 60 * 1000);

      // Actual logout
      logoutTimer = window.setTimeout(() => {
        logout();
        setWarningVisible(false);
        navigate("/login"); // redirect immediately
      }, AUTO_LOGOUT_MINUTES * 60 * 1000);
    };

    const events = ["mousemove", "mousedown", "keypress", "scroll", "touchstart"];
    events.forEach((event) => window.addEventListener(event, resetTimers));

    resetTimers();

    return () => {
      clearTimeout(logoutTimer);
      clearTimeout(warningTimer);
      events.forEach((event) => window.removeEventListener(event, resetTimers));
    };
  }, [logout, navigate]);

  return (
    <>
      {warningVisible && (
  <div
    style={{
      position: "fixed",
      top: 20,                 // changed from bottom to top
      left: "50%",             // center horizontally
      transform: "translateX(-50%)",
      backgroundColor: "#fc7d4b", // amber for warning
      color: "white",
      padding: "12px 24px",
      borderRadius: 8,
      zIndex: 9999,
      boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
      fontWeight: 500,
      fontSize: "14px",
      textAlign: "center",
    }}
  >
    ⚠️ You will be logged out in {WARNING_MINUTES} minute
    {WARNING_MINUTES > 1 ? "s" : ""} due to inactivity.
  </div>
)}
      {children}
    </>
  );
}