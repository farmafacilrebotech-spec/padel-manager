import { StrictMode, Component } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

class AppErrorBoundary extends Component {
  state = { err: null };

  static getDerivedStateFromError(err) {
    return { err };
  }

  render() {
    if (this.state.err) {
      const e = this.state.err;
      return (
        <div style={{ padding: 24, background: "#1a1a1a", color: "#eee", minHeight: "100vh", textAlign: "left" }}>
          <h1 style={{ marginTop: 0 }}>Algo salió mal</h1>
          <p>Si el problema continúa, recarga la página (F5).</p>
          <pre style={{ color: "#ff8a80", whiteSpace: "pre-wrap", fontSize: 13 }}>
            {String(e?.message || e)}
            {e?.stack ? `\n\n${e.stack}` : ""}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </StrictMode>
);
