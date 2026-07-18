import { useEffect, useState, useCallback } from "react";
import client from "../../api/client";

function statusBadge(status, lastTime) {
  const time = lastTime ? new Date(lastTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";
  if (status === "checked_out") return <span className="status-badge out"><span className="dot"></span>Checked out {time}</span>;
  if (status === "checked_in") return <span className="status-badge in"><span className="dot"></span>Checked in {time}</span>;
  return <span className="status-badge none"><span className="dot"></span>Not checked in</span>;
}

export default function OverviewTab() {
  const [today, setToday] = useState([]);
  const [log, setLog] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [todayRes, logRes] = await Promise.all([
        client.get("/attendance/today"),
        client.get("/attendance/log"),
      ]);
      setToday(todayRes.data);
      setLog(logRes.data);
    } catch (err) {
      console.error("Dashboard engine failed background sync:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const activePollingTimer = setInterval(() => { load(); }, 4000);
    return () => clearInterval(activePollingTimer);
  }, [load]);

  if (loading) return <div className="loading-wrap"><span className="spinner"></span> Loading </div>;

  // --- SYSTEMS THINKING CORE: GROUP WORKERS BY SITE ON THE FLY ---
  const sitesMap = {};
  
  today.forEach((worker) => {
    const siteKey = worker.site_name || "Unassigned Workers";
    if (!sitesMap[siteKey]) {
      sitesMap[siteKey] = {
        name: siteKey,
        present: [],
        totalCount: 0
      };
    }
    sitesMap[siteKey].totalCount += 1;
    if (worker.status === "checked_in") {
      sitesMap[siteKey].present.push(worker);
    }
  });

  const siteTiles = Object.values(sitesMap);
  const totalCheckedIn = today.filter((t) => t.status === "checked_in").length;

  return (
    <>
      {/* Upper Micro Statistics Bar */}
      <div className="stat-grid">
        <div className="stat"><div className="num">{today.length}</div><div className="lab">Total workers</div></div>
        <div className="stat"><div className="num">{totalCheckedIn}</div><div className="lab">Active On-Site</div></div>
      </div>

      {/* ==========================================
          👷 NEW LIVE SITE TILES MATRIX VIEW
         ========================================== */}
      <h3>Live Site Overview</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px", marginBottom: "26px" }}>
        {siteTiles.map((site) => (
          <div className="card card-flush" key={site.name} style={{ borderTop: site.name === "Unassigned Workers" ? "3px solid var(--border)" : "3px solid var(--accent)" }}>
            
            {/* Fake Image Placeholder Area utilizing internal CSS theme structures */}
            <div style={{ background: "var(--surface-2)", padding: "16px", position: "relative" }}>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "20px", fontWeight: "700" }}>{site.name}</div>
              <span className="status-badge in" style={{ position: "absolute", right: "12px", top: "16px" }}>
                {site.present.length} Active
              </span>
            </div>

            {/* Roster Layout Body */}
            <div style={{ padding: "16px" }}>
              <div style={{ fontSize: "11px", fontWeight: "700", color: "var(--text-dim)", textTransform: "uppercase", marginBottom: "8px", letterSpacing: "0.5px" }}>
                Active Roster ({site.present.length} / {site.totalCount})
              </div>
              
              {site.present.length === 0 ? (
                <div className="muted" style={{ fontSize: "13px", padding: "4px 0" }}>💤 No active check-ins right now.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {site.present.map((w) => {
                    const initials = w.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
                    return (
                      <div key={w.user_id} className="row-between" style={{ background: "var(--bg)", padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--border)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "var(--surface-2)", color: "var(--accent)", fontSize: "11px", fontWeight: "700", display: "flex", alignItems: "center", justifyOrigin: "center", justifyContent: "center", border: "1px solid var(--border)" }}>
                            {initials}
                          </div>
                          <span style={{ fontSize: "14px" }}>{w.name}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        ))}
      </div>

      {/* Keep your recent raw chronological history logs underneath */}
      <h3>Recent Activity Log</h3>
      <div className="card card-flush">
        {log.length === 0 ? (
          <div className="empty-state">No attendance recorded yet.</div>
        ) : (
          <table>
            <thead><tr><th>Worker</th><th>Type</th><th>When</th><th>Distance</th></tr></thead>
            <tbody>
              {log.map((r) => (
                <tr key={r.id}>
                  <td>{r.user_name}</td>
                  <td>
                    {(r.type === "check_in" || r.type === "in")
                      ? <span className="status-badge in"><span className="dot"></span>In</span>
                      : <span className="status-badge out"><span className="dot"></span>Out</span>}
                  </td>
                  <td>{new Date(r.timestamp).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</td>
                  <td className="muted">{Math.round(r.distance_m)}m</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
