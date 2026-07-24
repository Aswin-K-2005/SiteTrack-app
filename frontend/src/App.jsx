import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { useState, useEffect } from "react";
import ProtectedRoute from "./components/ProtectedRoute";
import Topbar from "./components/Topbar";
import Login from "./pages/Login";
import SetPassword from "./pages/SetPassword";
import Home from "./pages/Home";

function Layout({ children }) {
  const { user } = useAuth();
  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-on-surface font-body-md select-none relative overflow-x-hidden">
      <Topbar />
      <main 
        className={`flex-grow w-full mx-auto px-6 pb-12 z-10 ${user?.role === "admin" ? "max-w-7xl" : "max-w-xl"}`}
        /* THE FIX: Adjusts the main content down so it doesn't get covered by the newly expanded Topbar */
        style={{ paddingTop: 'calc(6rem + env(safe-area-inset-top, 0px))' }}
      >
        {children}
      </main>

      {/* Industrial Animated Wireframe Background Overlay */}
      {/* THE FIX: Removed 'hidden', scaled to 75% on mobile, and shifted to the upper right edge */}
      <div className="fixed top-1/4 -right-16 md:top-auto md:bottom-8 md:right-8 pointer-events-none opacity-10 md:opacity-20 z-0 scale-75 md:scale-100">
        <div className="w-48 h-48 border-[1px] border-primary flex items-center justify-center animate-spin" style={{ animationDuration: '20s' }}>
          <div className="w-40 h-40 border-[1px] border-primary/50 animate-reverse-spin" style={{ animationDuration: '15s' }}></div>
        </div>
      </div>
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Layout><Login /></Layout>} />
      <Route path="/set-password" element={<Layout><SetPassword /></Layout>} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout><Home /></Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default function App() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Monitors the phone's network connection in real-time
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Full screen warning if the worker loses internet
  if (isOffline) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-background text-on-surface p-6 z-[9999] relative">
         <div className="absolute top-0 left-0 h-1.5 w-full bg-repeating-linear-gradient from-error via-background to-error"
              style={{ backgroundImage: 'repeating-linear-gradient(135deg, #ff5449 0 10px, #0c1322 10px 20px)' }}></div>
        
        <span className="material-symbols-outlined text-6xl text-error mb-4" style={{ fontVariationSettings: "'FILL' 1" }}>wifi_off</span>
        <h2 className="font-headline-md text-2xl uppercase tracking-widest text-error text-center">Connection Lost</h2>
        <p className="font-body-md text-sm text-on-surface-variant mt-2 text-center max-w-xs">
          SiteTrack requires an active network connection to map GPS coordinates and sync rosters. Please check your signal.
        </p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
