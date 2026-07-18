import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function LogoMark() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
      <path d="M4 20V11L12 5L20 11V20" stroke="#ff7a1a" strokeWidth="2" strokeLinejoin="round" />
      <path d="M9 20V14H15V20" stroke="#f1efe9" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="12" cy="9" r="1.6" fill="#f5c518" />
    </svg>
  );
}

export default function Topbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="topbar">
      <a href="/" className="brand" style={{ pointerEvents: user ? "auto" : "none" }}>
        <LogoMark />
        <div className="brand-text">Site<span>Track</span></div>
      </a>
      {user && (
        <div className="topbar-right">
          <div className="user-chip">
            <b>{user.name}</b>
            {user.role === "admin" ? "Admin" : user.site_name || "Unassigned"}
          </div>
          <button className="btn-logout" onClick={handleLogout}>Log out</button>
        </div>
      )}
    </div>
  );
}
