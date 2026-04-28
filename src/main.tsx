import React, { Component, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Missing root element");
}

const App = lazy(() => import("./App"));

class BootBoundary extends Component<{ children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error) {
    console.error("BuyWise boot failed", error);
    window.setTimeout(() => window.location.reload(), 600);
  }

  render() {
    if (this.state.failed) return <BootLoader message="Reloading preview…" />;
    return this.props.children;
  }
}

function BootLoader({ message = "Loading property intelligence…" }: { message?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground px-6">
      <div className="text-center">
        <div className="text-3xl font-extrabold mb-2">BuyWise Israel</div>
        <div className="text-sm text-muted-foreground">{message}</div>
      </div>
    </div>
  );
}

createRoot(root).render(
  <BootBoundary>
    <Suspense fallback={<BootLoader />}>
      <App />
    </Suspense>
  </BootBoundary>
);
