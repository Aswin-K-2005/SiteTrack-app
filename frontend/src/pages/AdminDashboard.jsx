import { useState } from "react";
import OverviewTab from "./admin/OverviewTab";
import WorkersTab from "./admin/WorkersTab";
import SitesTab from "./admin/SitesTab";
import HolidaysTab from "./admin/HolidaysTab";
import LeavesTab from "./admin/LeavesTab";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "workers", label: "Workers" },
  { id: "sites", label: "Sites" },
  { id: "holidays", label: "Holidays" },
  { id: "leaves", label: "Leaves" },
];

const MOBILE_TABS = [
  { id: "overview", label: "Dashboard", icon: "dashboard" },
  { id: "workers", label: "Directory", icon: "badge" },
  { id: "sites", label: "Sites", icon: "location_on" },
  { id: "holidays", label: "Schedule", icon: "event" },
  { id: "leaves", label: "Leaves", icon: "edit_document" },
];

export default function AdminDashboard() {
  const [tab, setTab] = useState("overview");

  return (
    <div className="w-full space-y-6 pb-24 md:pb-0">
      <div>
        <h1 className="font-headline-lg text-4xl text-on-surface uppercase tracking-tight">Admin Dashboard</h1>
        <p className="font-body-md text-sm text-on-surface-variant mt-1">Manage sites, worker credentials, and automatic geofence rosters.</p>
      </div>

      {/* DESKTOP TABS: Hidden on mobile */}
      <div className="hidden md:flex bg-surface-container-high p-1 rounded-xl max-w-md w-full border border-outline-variant">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-2 text-center rounded-lg font-label-caps text-sm uppercase tracking-wider font-bold transition-all ${
              tab === t.id
                ? "bg-primary-container text-on-primary shadow-md"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* MOBILE BOTTOM NAV - BULLETPROOF GLASSMORPHISM & SAFE AREA */}
      <div 
        className="md:hidden fixed left-0 right-0 w-full border-t border-outline-variant/50 z-[100] flex justify-around items-center px-2 pt-3 shadow-[0_-10px_40px_rgba(0,0,0,0.6)]"
        style={{
          bottom: '0px',
          backgroundColor: 'rgba(12, 19, 34, 0.85)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' 
        }}
      >
        {MOBILE_TABS.map((t) => {
          const isActive = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex flex-col items-center justify-center min-w-[64px] transition-all btn-push ${
                isActive ? "text-primary" : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <div className={`flex items-center justify-center px-4 py-1 rounded-full mb-1 transition-colors ${isActive ? "bg-primary-container/20" : ""}`}>
                <span 
                  className="material-symbols-outlined text-2xl transition-all"
                  style={{
                    fontFamily: "'Material Symbols Outlined', sans-serif",
                    fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" 
                  }}
                >
                  {t.icon}
                </span>
              </div>
              <span className={`font-label-caps text-[10px] tracking-wider ${isActive ? "font-bold" : ""}`}>
                {t.label}
              </span>
            </button>
          );
        })}
      </div>

      <div className="pt-2">
        {tab === "overview" && <OverviewTab />}
        {tab === "workers" && <WorkersTab />}
        {tab === "sites" && <SitesTab />}
        {tab === "holidays" && <HolidaysTab />}
        {tab === "leaves" && <LeavesTab />}
      </div>
    </div>
  );
}
