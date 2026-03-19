// src/main.tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css"; // make sure your CSS path is correct
import App from "./App";

async function startApp() {
  // Only start the MSW (mock service worker) in development
  if (import.meta.env.DEV) {
    const { worker } = await import("./mocks/browser");
    await worker.start();
  }

  // Get the root element safely
  const rootEl = document.getElementById("root");
  if (!rootEl) throw new Error("Root element not found");

  // Render React
  createRoot(rootEl).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}

// Start the app
startApp();