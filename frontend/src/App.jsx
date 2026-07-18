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
    <div className="min-h-screen flex flex-col bg-background text-on-surface font-body-md select-none">
      <Topbar />
      <main className={`flex-grow w-full mx-auto px-6 pt-24 pb-12 ${user?.role === "admin" ? "max-w-7xl" : "max-w-xl"}`}>
        {children}
      </main>
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
