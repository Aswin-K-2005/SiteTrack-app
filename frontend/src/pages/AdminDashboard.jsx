import { useState } from "react";
import OverviewTab from "./admin/OverviewTab";
import WorkersTab from "./admin/WorkersTab";
import SitesTab from "./admin/SitesTab";
import HolidaysTab from "./admin/HolidaysTab";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "workers", label: "Workers" },
  { id: "sites", label: "Sites" },
  { id: "holidays", label: "Holidays" },
];

export default function AdminDashboard() {
  const [tab, setTab] = useState("overview");

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="font-headline-lg text-4xl text-on-surface uppercase tracking-tight">Admin Dashboard</h1>
        <p className="font-body-md text-sm text-on-surface-variant mt-1">Manage sites, worker credentials, and automatic geofence rosters.</p>
      </div>

      {/* Modern High-Contrast Dynamic Tab Selector Row */}
      <div className="bg-surface-container-high p-1 rounded-xl flex max-w-md w-full border border-outline-variant">
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

      <div className="pt-2">
        {tab === "overview" && <OverviewTab />}
        {tab === "workers" && <WorkersTab />}
        {tab === "sites" && <SitesTab />}
        {tab === "holidays" && <HolidaysTab />}
      </div>
    </div>
  );
}
