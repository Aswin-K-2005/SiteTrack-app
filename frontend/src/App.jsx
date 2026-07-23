import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Topbar from "./components/Topbar";
import Login from "./pages/Login";
import SetPassword from "./pages/SetPassword";
import Home from "./pages/Home";

function Layout({ children }) {
  const { user } = useAuth();
  return (
    /* THE FIX: min-h-[100dvh] forces the wrapper to respect physical mobile screen bounds */
    <div className="min-h-[100dvh] flex flex-col bg-background text-on-surface font-body-md select-none relative overflow-x-hidden">
      <Topbar />
      <main className={`flex-grow w-full mx-auto px-6 pt-24 pb-12 z-10 ${user?.role === "admin" ? "max-w-7xl" : "max-w-xl"}`}>
        {children}
      </main>

      {/* Industrial Animated Wireframe Background Overlay */}
      <div className="fixed bottom-8 right-8 pointer-events-none opacity-20 z-0 hidden md:block">
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
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
