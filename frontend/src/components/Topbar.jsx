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
    <div 
      className="fixed top-0 left-0 right-0 z-50 bg-surface/80 backdrop-blur-md border-b border-outline-variant/30"
      /* THE FIX: Pushes the inner content below the iPhone notch automatically */
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      {/* Industrial Construction Hazard Stripes Accent */}
      <div className="h-1.5 w-full bg-repeating-linear-gradient from-tertiary via-background to-tertiary"
            style={{ backgroundImage: 'repeating-linear-gradient(135deg, #f9bd22 0 10px, #0c1322 10px 20px)' }}></div>
            
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        <div>
          <div className="font-label-caps text-[10px] tracking-widest text-primary-container font-bold uppercase">SiteTrack App</div>
          <div className="font-headline-sm text-lg text-on-surface font-bold tracking-wide mt-0.5">
            Welcome, {user ? user.name.split(" ")[0] : 'Worker'}
          </div>
        </div>
        
        {user && (
          <div className="flex items-center gap-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#1a2e21] border border-[#4edea3]/30 rounded-full text-[#4edea3] text-xs font-label-caps tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3] animate-pulse"></span>
              {user.role === "admin" ? "Admin" : "On Site"}
            </div>
            <button 
               className="px-3 py-1.5 border border-outline-variant text-on-surface-variant hover:text-error hover:border-error/50 font-label-caps text-xs rounded transition-all cursor-pointer"
               onClick={handleLogout}
            >
              Log out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
