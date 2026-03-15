import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { LanguageProvider } from "./contexts/LanguageContext";

const container = document.getElementById("root");

if (container) {
  createRoot(container).render(
    <LanguageProvider>
      <App />
    </LanguageProvider>
  );
}

