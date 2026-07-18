import axios from "axios";

// Set VITE_API_URL in .env when deploying; falls back to local dev backend.
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const client = axios.create({ baseURL: API_URL });

client.interceptors.request.use((config) => {
  const token = localStorage.getItem("sitetrack_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // ⚡ THE TUNNEL ULTRA BYPASS ENGINE
  // bypass-tunnel-reminder kills the 511 response screen from localtunnel
  // ngrok-skip-browser-warning handles structural deviations on ngrok profiles
  config.headers["bypass-tunnel-reminder"] = "true";
  config.headers["ngrok-skip-browser-warning"] = "true";
  
  return config;
});

client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      // Clean up local storage items silently without disrupting the React lifecycle
      localStorage.removeItem("sitetrack_token");
      localStorage.removeItem("sitetrack_role");
    }
    return Promise.reject(err);
  }
);

export default client;

export function apiErrorMessage(err, fallback = "Something went wrong. Please try again.") {
  const detail = err?.response?.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail[0]?.msg) return detail[0].msg;
  return fallback;
}
