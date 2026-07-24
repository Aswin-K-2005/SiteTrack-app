import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth();

  // Premium Server Loading Screen
  if (loading) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-background text-on-surface p-6">
        <div className="w-24 h-24 border-[2px] border-primary-container flex items-center justify-center animate-spin" style={{ animationDuration: '3s' }}>
          <div className="w-20 h-20 border-[2px] border-primary/50 animate-reverse-spin" style={{ animationDuration: '2s' }}></div>
        </div>
        <h2 className="font-headline-sm text-2xl uppercase tracking-widest mt-8 text-primary">Establishing Connection</h2>
        <p className="font-body-md text-sm text-on-surface-variant mt-2 text-center max-w-xs animate-pulse">
          Synchronizing with secure server...
        </p>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (user.must_change_password) return <Navigate to="/set-password" replace />;
  if (adminOnly && user.role !== "admin") return <Navigate to="/" replace />;

  return children;
}
