import { createRoot } from "react-dom/client";
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

import("./App.tsx")
  .then(({ default: App }) => {
    createRoot(root).render(<App />);
  })
  .catch((error) => {
    console.error("Failed to load BuyWise app", error);
    root.innerHTML = `
      <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#ffffff;color:#0f172a;font-family:Inter,system-ui,sans-serif;padding:24px">
        <div style="max-width:520px;text-align:center">
          <div style="font-size:28px;font-weight:800;margin-bottom:8px">BuyWise Israel</div>
          <div style="font-size:16px;color:#334155;margin-bottom:8px">The preview is still starting.</div>
          <div style="font-size:14px;color:#64748b">Refresh once in a few seconds; the app shell is protected from blank-screen failures now.</div>
        </div>
      </div>
    `;
  });
