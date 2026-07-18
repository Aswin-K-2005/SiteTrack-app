import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading-wrap"><span className="spinner"></span> Loading…</div>;
  }
  if (!user) return <Navigate to="/login" replace />;
  if (user.must_change_password) return <Navigate to="/set-password" replace />;
  if (adminOnly && user.role !== "admin") return <Navigate to="/" replace />;

  return children;
}
