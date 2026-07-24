import { useEffect, useState, useCallback } from "react";
import client from "../../api/client";


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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-on-surface-variant font-headline-sm text-lg gap-3">
        <span className="animate-spin rounded-none h-5 w-5 border-2 border-primary border-t-transparent"></span>
        SYNCING LIVE ROSTER SYSTEM...
      </div>
    );
  }
  // Group workers by construction site on the fly
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
    <div className="space-y-8">
      {/* High Level Stats Bento */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-surface-variant border border-outline-variant p-4 rounded-xl relative overflow-hidden group">
          <span className="font-data-display text-5xl text-primary-container">{today.length}</span>
          <h4 className="font-label-caps text-xs text-on-surface-variant uppercase mt-2 tracking-widest">Total Workers</h4>
        </div>
        
        <div className="bg-surface-variant border border-outline-variant p-4 rounded-xl relative overflow-hidden group">
          <span className="font-data-display text-5xl text-secondary">{totalCheckedIn}</span>
          <h4 className="font-label-caps text-xs text-on-surface-variant uppercase mt-2 tracking-widest">Active On-Site</h4>
        </div>

        <div className="bg-surface-variant border border-outline-variant p-4 rounded-xl md:col-span-2 lg:col-span-1 flex flex-col justify-center">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-label-caps text-xs text-on-surface-variant uppercase tracking-widest">System Health</h4>
            <span className="w-3 h-3 rounded-full bg-secondary animate-pulse"></span>
          </div>
          <div className="h-2 w-full bg-surface-container-lowest rounded-full overflow-hidden">
            <div className="h-full bg-[#4edea3] w-full"></div>
          </div>
          <p className="text-[10px] mt-2 text-on-surface-variant uppercase">All geofences operational</p>
        </div>
      </div>

      {/* Live Site Overview Matrix */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-headline-sm text-xl text-on-surface border-l-4 border-primary-container pl-3 uppercase tracking-wider">Live Site Overview</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {siteTiles.map((site) => (
            <div className="bg-surface-variant border border-outline-variant rounded-xl overflow-hidden border-t-2 border-t-primary-container" key={site.name}>
              <div className="p-4 flex justify-between items-start bg-surface-container-high/30">
                <div>
                  <h3 className="font-headline-md text-lg text-on-surface font-bold">{site.name}</h3>
                </div>
                <span className="bg-surface-container-highest text-secondary font-label-caps text-[10px] px-2 py-1 rounded border border-secondary/20">
                  {site.present.length} ACTIVE
                </span>
              </div>
              
              <div className="p-4 border-t border-outline-variant">
                <span className="font-label-caps text-xs text-on-surface-variant uppercase block mb-4">
                  Active Roster ({site.present.length} / {site.totalCount})
                </span>
                
                {site.present.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-on-surface-variant/50 text-sm">
                    <p className="font-body-md">No active check-ins right now.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {site.present.map((w) => {
                      const initials = w.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
                      return (
                        <div key={w.user_id} className="flex justify-between items-center bg-surface-container-low border border-outline-variant p-2 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-surface-container-highest text-primary-container text-xs font-bold flex items-center justify-center border border-outline-variant">
                              {initials}
                            </div>
                            <span className="text-sm font-bold">{w.name}</span>
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
      </section>

      {/* Chronological Activity Log Table */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-headline-sm text-xl text-on-surface border-l-4 border-primary-container pl-3 uppercase tracking-wider">Recent Activity Log</h2>
          <span className="text-xs font-label-caps text-on-surface-variant bg-surface-container-high px-2 py-1 rounded">Real-time update</span>
        </div>
        
        <div className="bg-surface-variant border border-outline-variant rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-surface-container-high border-b border-outline-variant">
                <tr>
                  <th className="px-4 py-3 font-label-caps text-xs text-on-surface-variant uppercase tracking-wider">Worker</th>
                  <th className="px-4 py-3 font-label-caps text-xs text-on-surface-variant uppercase tracking-wider">Type</th>
                  <th className="px-4 py-3 font-label-caps text-xs text-on-surface-variant uppercase tracking-wider">When</th>
                  <th className="px-4 py-3 font-label-caps text-xs text-on-surface-variant uppercase tracking-wider text-right">Distance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {log.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="p-8 text-center text-on-surface-variant/50 text-sm">No activity records stream registered today.</td>
                  </tr>
                ) : (
                  log.map((r) => (
                    <tr key={r.id} className="hover:bg-surface-container/50 transition-colors">
                      <td className="px-4 py-4 font-body-md text-sm text-on-surface font-bold">{r.user_name}</td>
                      <td className="px-4 py-4">
                        {r.type === "check_in" || r.type === "in" ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-secondary-container/20 border border-secondary border-secondary/30 text-[10px] font-bold text-secondary">IN</span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-error-container/20 border border-error border-error/30 text-[10px] font-bold text-error">OUT</span>
                        )}
                      </td>
                      <td className="px-4 py-4 font-body-md text-sm text-on-surface-variant">
                        {new Date(r.timestamp).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td className="px-4 py-4 font-body-md text-sm text-on-surface text-right font-bold">{Math.round(r.distance_m)}m</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
