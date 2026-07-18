import { useState } from "react";
import OverviewTab from "./admin/OverviewTab";
import WorkersTab from "./admin/WorkersTab";
import SitesTab from "./admin/SitesTab";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "workers", label: "Workers" },
  { id: "sites", label: "Sites" },
];

export default function AdminDashboard() {
  const [tab, setTab] = useState("overview");

  return (
    <>
      <h1>Admin dashboard</h1>
      <p className="subtitle">Manage sites, workers, and attendance.</p>

      <div className="tabs">
        {TABS.map((t) => (
          <div key={t.id} className={`tab ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>
            {t.label}
          </div>
        ))}
      </div>

      {tab === "overview" && <OverviewTab />}
      {tab === "workers" && <WorkersTab />}
      {tab === "sites" && <SitesTab />}
    </>
  );
}
