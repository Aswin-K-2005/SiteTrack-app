import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "leaflet/dist/leaflet.css";
import "./index.css";
import App from "./App.jsx";

// THE FIX: Register the Service Worker immediately on page load so Chrome sees the PWA!
if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("/firebase-messaging-sw.js").catch((err) => {
            console.log("SW registration failed: ", err);
        });
    });
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
