import { createRoot } from "react-dom/client";
import { BrowserRouter as Router } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import AppRoutes from "./routes";
import "./index.scss";

const rootElement = document.getElementById("app")!;
const root = createRoot(rootElement);

root.render(
  <Router>
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  </Router>
);
