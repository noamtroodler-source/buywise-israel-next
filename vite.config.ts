import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  // Workaround: ensure Vite doesn't keep a stale pre-bundled react-leaflet build.
  // react-leaflet v5 expects React 19 (uses React.use), but this app is on React 18.
  optimizeDeps: {
    exclude: ["react-leaflet", "@react-leaflet/core"],
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
