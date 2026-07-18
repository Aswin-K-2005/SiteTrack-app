import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Topbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="glass-header">
      {/* The hazard stripes live inside the sticky container now */}
      <div className="glass-stripes"></div>
      
      <div className="glass-topbar-content">
        <div className="glass-brand">
          <div className="glass-brand-sub">SiteTrack App</div>
          <div className="glass-brand-title">
            Welcome, {user ? user.name.split(" ")[0] : 'Worker'}
          </div>
        </div>

        {user && (
          <div className="topbar-right">
            <div className="glass-status-pill">
              {/* Swapped the spinner out for a clean, static, valid system indicator dot */}
              <span className="dot" style={{ backgroundColor: 'var(--success)' }}></span>
              {user.role === "admin" ? "Admin" : "On Site"}
            </div>
            <button className="btn-logout" onClick={handleLogout}>Log out</button>
          </div>
        )}
      </div>
    </div>
  );
}
