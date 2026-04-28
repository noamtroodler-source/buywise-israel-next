import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Missing root element");
}

root.innerHTML = `
  <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#ffffff;color:#0f172a;font-family:Inter,system-ui,sans-serif">
    <div style="text-align:center">
      <div style="font-size:28px;font-weight:800;margin-bottom:8px">BuyWise Israel</div>
      <div style="font-size:15px;color:#64748b">Loading property intelligence…</div>
    </div>
  </div>
`;

createRoot(root).render(<App />);
