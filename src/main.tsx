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

const loadApp = async () => {
  let lastError: unknown;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const app = await import("./App.tsx");
      sessionStorage.removeItem("app-module-reload");
      return app;
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => window.setTimeout(resolve, 300 * (attempt + 1)));
    }
  }

  const message = lastError instanceof Error ? lastError.message : String(lastError);
  if (message.includes("Failed to fetch dynamically imported module") && !sessionStorage.getItem("app-module-reload")) {
    sessionStorage.setItem("app-module-reload", String(Date.now()));
    window.location.reload();
    return new Promise<never>(() => undefined);
  }

  throw lastError;
};

loadApp()
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
