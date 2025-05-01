import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { registerServiceWorker } from "./lib/service-worker";

// Initialize service worker
registerServiceWorker().catch(error => {
  console.error('Service worker registration error:', error);
});

createRoot(document.getElementById("root")!).render(<App />);
