import { useEffect, useState, useCallback } from "react";
import client, { apiErrorMessage } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { calculateDistance } from "../utils/geo";
import { requestPushPermission, listenForMessages } from "../firebase";

function getPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported on this device."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(pos.coords),
      (err) => reject(new Error(err.message || "Could not get your location.")),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  });
}

function dateLabel(str) {
  if (!str) return "";
  return new Date(str + "T00:00:00").toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}

function timeLabel(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function EmployeeHome() {
  const { user } = useAuth();
  
  // Tab State for Mobile
  const [tab, setTab] = useState("attendance");

  // Existing States
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [currentLat, setCurrentLat] = useState(null);
  const [currentLon, setCurrentLon] = useState(null);
  const [todayHoliday, setTodayHoliday] = useState(null);
  const [onLeaveToday, setOnLeaveToday] = useState(false);

  // Leave Request States
  const [leaves, setLeaves] = useState([]);
  const [leaveStart, setLeaveStart] = useState("");
  const [leaveEnd, setLeaveEnd] = useState("");
  const [leaveReason, setLeaveReason] = useState("");
  const [leaveBusy, setLeaveBusy] = useState(false);
  const [leaveMsg, setLeaveMsg] = useState("");

  const loadHistory = useCallback(async () => {
    try {
      const [attRes, holRes, leaveRes] = await Promise.all([
        client.get("/attendance/me"),
        client.get("/holidays"),
        client.get("/leaves/me")
      ]);
      setHistory(attRes.data);
      setLeaves(leaveRes.data);
      
      const targetFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' });
      const todayStr = targetFormatter.format(new Date());
      
      const holidayToday = holRes.data.find(h => {
        if (h.holiday_date !== todayStr) return false;
        return h.site_id === null || user?.sites?.some(s => s.id === h.site_id);
      });
      setTodayHoliday(holidayToday || null);

      const activeLeave = leaveRes.data.find(l => 
        l.status === 'approved' && 
        l.start_date <= todayStr && 
        l.end_date >= todayStr
      );
      setOnLeaveToday(!!activeLeave);

    } catch {
      // Non-fatal fallback
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    listenForMessages();
  }, []);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        loadHistory();
      }
    };
    
    window.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", loadHistory);
    
    return () => {
      window.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", loadHistory);
    };
  }, [loadHistory]);

  useEffect(() => {
    loadHistory();
    if (navigator.geolocation) {
        const watchId = navigator.geolocation.watchPosition(
            (pos) => {
                setCurrentLat(pos.coords.latitude);
                setCurrentLon(pos.coords.longitude);
            },
            (err) => console.warn("Live tracking issue:", err),
            { enableHighAccuracy: true, maximumAge: 10000 }
        );
        return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [loadHistory]);

  const targetFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' });
  const today = targetFormatter.format(new Date()); 

  const todaysRecords = history.filter((r) => r.record_date === today);
  const hasIn = todaysRecords.find((r) => r.type === "check_in" || r.type === "in");
  const hasOut = todaysRecords.find((r) => r.type === "check_out" || r.type === "out");
  const willCheckout = !!hasIn && !hasOut;
  const done = !!hasIn && !!hasOut;

  async function handleMark() {
    setError(""); setInfo("");
    setBusy(true);
    try {
      const coords = await getPosition();
      const res = await client.post("/attendance/mark", {
        latitude: coords.latitude,
        longitude: coords.longitude,
      });
      
      const isCheckIn = res.data.type === "check_in" || res.data.type === "in";
      const label = isCheckIn ? "Checked in" : "Checked out";
      setInfo(`${label} at ${timeLabel(res.data.timestamp)} - ${Math.round(res.data.distance_m)}m from site.`);
      await loadHistory();
    } catch (err) {
      setError(apiErrorMessage(err, "Could not mark attendance. Please allow location access and try again."));
    } finally {
      setBusy(false);
    }
  }

  async function handleUndoCheckout() {
    if (!window.confirm("Are you sure you want to undo your check-out? You will be placed back on the clock.")) return;
    
    setError(""); setInfo("");
    setBusy(true);
    try {
      await client.delete("/attendance/undo");
      setInfo("Check-out reversed. Your shift is active again.");
      await loadHistory();
    } catch (err) {
      setError(apiErrorMessage(err, "Could not reverse check-out."));
    } finally {
      setBusy(false);
    }
  }

  async function handleLeaveSubmit(e) {
    e.preventDefault();
    setLeaveMsg(""); 
    setLeaveBusy(true);
    try {
      await client.post("/leaves/request", {
        start_date: leaveStart,
        end_date: leaveEnd,
        reason: leaveReason
      });
      setLeaveMsg("Leave request submitted successfully. Pending Admin approval.");
      setLeaveStart(""); setLeaveEnd(""); setLeaveReason("");
      
      const res = await client.get("/leaves/me");
      setLeaves(res.data);
    } catch (err) {
      setLeaveMsg(apiErrorMessage(err));
    } finally {
      setLeaveBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-on-surface-variant font-headline-sm text-lg gap-3 bg-background">
        <span className="animate-spin rounded-full h-5 w-5 border-2 border-primary-container border-t-transparent"></span>
        LOADING CANVAS...
      </div>
    );
  }

  const MOBILE_TABS = [
    { id: "attendance", label: "Tracker", icon: "my_location" },
    { id: "leaves", label: "Time Off", icon: "event_busy" }
  ];

  return (
    <div className="flex-grow pt-24 pb-28 md:pb-12 px-6 max-w-7xl mx-auto w-full font-body-md text-on-surface relative">
      
      {/* MOBILE BOTTOM NAV */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-surface-container border-t-2 border-outline-variant z-50 flex justify-around items-center px-2 py-3 safe-area-pb">
        {MOBILE_TABS.map((t) => {
          const isActive = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex flex-col items-center justify-center min-w-[80px] transition-all btn-push ${
                isActive ? "text-primary" : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <div className={`flex items-center justify-center px-6 py-1.5 rounded-full mb-1 transition-colors ${isActive ? "bg-primary-container/20" : ""}`}>
                <span 
                  className="material-symbols-outlined text-2xl transition-all"
                  style={{ 
                    fontFamily: "'Material Symbols Outlined', sans-serif",
                    fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}

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

      {/* Header Section */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-headline-lg text-4xl text-on-surface uppercase tracking-tight">
            {tab === "attendance" ? "Mark Attendance" : "Leave Hub"}
          </h1>
          <p className="font-body-md text-sm text-on-surface-variant mt-2">
            {tab === "attendance" ? "Confirm your site location and record your entry/exit." : "Manage your time off requests and schedule."}
          </p>
        </div>
        
        <button 
          onClick={loadHistory}
          disabled={loading}
          className="p-3 bg-surface-container border border-outline-variant rounded-full text-on-surface hover:text-primary transition-all btn-push"
          title="Refresh Data"
        >
          <svg className={`w-5 h-5 ${loading ? 'animate-spin text-primary' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* SECTION 1: ATTENDANCE TRACKER */}
      <div className={`${tab === "attendance" ? "block" : "hidden md:block"}`}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-5 space-y-6">
            
            <div className="bg-surface-container border border-outline-variant p-4 flex items-center justify-between">
              <div>
                <span className="font-label-caps text-xs tracking-wider text-on-surface-variant block mb-1">CURRENT STATUS</span>
                {done ? (
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-error-container/20 text-error border border-error/30 rounded-full">
                    <span className="w-2 h-2 rounded-full bg-error"></span>
                    <span className="font-label-caps text-xs uppercase">Checked Out</span>
                  </div>
                ) : hasIn ? (
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#1a2e21] text-[#4edea3] rounded-full">
                    <span className="w-2 h-2 rounded-full bg-secondary"></span>
                    <span className="font-label-caps text-xs uppercase">Checked In</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-surface-container-highest text-on-surface-variant rounded-full">
                    <span className="w-2 h-2 rounded-full bg-outline"></span>
                    <span className="font-label-caps text-xs uppercase">Not Checked In</span>
                  </div>
                )}
              </div>
              <div className="text-right">
                <span className="font-label-caps text-xs tracking-wider text-on-surface-variant block mb-1">LAST ACTION</span>
                <span className="font-body-md text-sm font-bold">
                  {done ? timeLabel(hasOut.timestamp) : hasIn ? timeLabel(hasIn.timestamp) : "--:--"}
                </span>
              </div>
            </div>

            {error && <div className="bg-error-container/20 border-l-4 border-error p-3 text-xs text-error">{error}</div>}
            {info && <div className="bg-[#1a2e21] border-l-4 border-secondary p-3 text-xs text-[#4edea3]">{info}</div>}

            <div className="mt-4">
                <h2 className="font-label-caps text-xs tracking-wider text-on-surface-variant block mb-2 uppercase">Your Workstations</h2>
                {user?.sites?.length > 0 ? (
                    <div className="space-y-3">
                        {user.sites.map(site => {
                            const distance = calculateDistance(currentLat, currentLon, site.latitude, site.longitude);
                            const isOnSite = distance !== null && distance <= site.radius_m;

                            return (
                                <div key={site.id} className="p-4 bg-surface-container-low border border-outline-variant rounded-lg flex justify-between items-center">
                                    <div>
                                        <h3 className="font-bold text-on-surface text-sm">{site.name}</h3>
                                        <p className="text-[10px] text-on-surface-variant uppercase mt-1">Radius: {site.radius_m}m</p>
                                    </div>
                                    {isOnSite ? (
                                        <span className="bg-[#1a2e21] text-[#4edea3] px-2.5 py-1 rounded text-[10px] font-bold tracking-wide border border-secondary/30 flex items-center gap-1.5">
                                            <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3] animate-pulse"></span>
                                            ON SITE
                                        </span>
                                    ) : (
                                        <span className="bg-surface-container-highest text-on-surface-variant px-2 py-1 rounded text-[10px] font-bold">
                                            {distance !== null ? `${Math.round(distance)}m away` : 'Locating...'}
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="p-4 bg-surface-container border border-outline-variant rounded-lg text-on-surface-variant/70 text-sm">
                        You have not been assigned to any sites yet.
                    </div>
                )}
            </div>

            {todayHoliday ? (
              <div className="bg-tertiary-container/20 border-2 border-tertiary p-6 rounded-xl text-center">
                <span className="font-label-caps text-tertiary tracking-widest text-xs uppercase block mb-2">System Locked</span>
                <h3 className="font-headline-sm text-xl text-on-surface uppercase">{todayHoliday.title}</h3>
                <p className="text-sm text-on-surface-variant mt-1">Attendance tracking is disabled for today.</p>
              </div>
            ) : onLeaveToday ? (
              <div className="bg-[#1a2e21] border-2 border-[#4edea3] p-6 rounded-xl text-center">
                <span className="font-label-caps text-[#4edea3] tracking-widest text-xs uppercase block mb-2">Leave Active</span>
                <h3 className="font-headline-sm text-xl text-on-surface uppercase">Approved Time Off</h3>
                <p className="text-sm text-on-surface-variant mt-1">Enjoy your time off! Attendance tracking is disabled.</p>
              </div>
            ) : done ? (
              <div className="bg-surface-container border-2 border-outline-variant p-6 rounded-xl text-center mt-4">
                <h3 className="font-headline-sm text-xl text-on-surface uppercase mb-1">Shift Completed</h3>
                <p className="text-sm text-on-surface-variant mb-6">Your final check-out has been recorded for today.</p>
                
                <button 
                  onClick={handleUndoCheckout} 
                  disabled={busy}
                  className="text-xs font-label-caps text-secondary hover:text-primary transition-colors btn-push flex items-center justify-center gap-2 mx-auto disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[16px]">history</span>
                  Accidentally checked out? Undo here.
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => handleMark("in")}
                  disabled={hasIn || busy}
                  className="flex flex-col items-center justify-center gap-3 py-6 bg-primary-container text-on-primary font-bold transition-all btn-push disabled:opacity-40 disabled:cursor-not-allowed group relative overflow-hidden"
                >
                  <span className="font-headline-sm text-lg uppercase tracking-wider">Check In</span>
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </button>
                
                <button
                  onClick={() => handleMark("out")}
                  disabled={!willCheckout || busy}
                  className="flex flex-col items-center justify-center gap-3 py-6 border-2 border-outline-variant text-on-surface font-bold hover:border-error transition-all btn-push disabled:opacity-40 disabled:cursor-not-allowed group relative overflow-hidden"
                >
                  <span className="font-headline-sm text-lg uppercase tracking-wider">Check Out</span>
                  <div className="absolute inset-0 bg-error/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </button>
              </div>
            )}
          </div>

          <div className="lg:col-span-7 space-y-4">
            <h2 className="font-headline-sm text-xl text-on-surface uppercase tracking-wider">Your Recent Activity</h2>
            <div className="overflow-x-auto bg-surface-container border border-outline-variant rounded-lg">
              {history.length === 0 ? (
                <div className="p-8 text-center text-on-surface-variant/50">No attendance historical logs mapped yet.</div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead className="bg-surface-container-highest border-b border-outline-variant">
                    <tr>
                      <th className="px-4 py-3 font-label-caps text-xs text-on-surface-variant tracking-wider">DATE</th>
                      <th className="px-4 py-3 font-label-caps text-xs text-on-surface-variant tracking-wider">TYPE</th>
                      <th className="px-4 py-3 font-label-caps text-xs text-on-surface-variant tracking-wider">TIME</th>
                      <th className="px-4 py-3 font-label-caps text-xs text-on-surface-variant tracking-wider">DISTANCE</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant">
                    {history.slice(0, 10).map((r) => (
                      <tr key={r.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-4 py-4 font-body-md text-sm">{dateLabel(r.record_date)}</td>
                        <td className="px-4 py-4">
                          {r.type === "check_in" || r.type === "in" ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-[#1a2e21] text-[#4edea3] font-label-caps text-[10px] rounded border border-secondary/30">IN</span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-error-container/20 text-error font-label-caps text-[10px] rounded border border-error/30">OUT</span>
                          )}
                        </td>
                        <td className="px-4 py-4 font-body-md text-sm text-on-surface-variant">{timeLabel(r.timestamp)}</td>
                        <td className="px-4 py-4 font-body-md text-sm">{Math.round(r.distance_m)}m</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* SECTION 2: LEAVE MANAGEMENT */}
      <div className={`mt-0 md:mt-12 md:border-t md:border-outline-variant md:pt-8 ${tab === "leaves" ? "block" : "hidden md:block"}`}>
        <h2 className="hidden md:block font-headline-sm text-2xl text-on-surface uppercase tracking-wider mb-6">Leave Management</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-5 bg-surface-container border border-outline-variant rounded-xl p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-primary-container"></div>
            <h3 className="font-headline-sm text-lg uppercase mb-4 text-on-surface">Request Time Off</h3>
            
            {leaveMsg && (
              <div className="p-3 mb-4 text-xs font-bold rounded bg-surface-container-highest text-on-surface border border-outline-variant">
                {leaveMsg}
              </div>
            )}
            
            <form onSubmit={handleLeaveSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-label-caps text-xs text-on-surface-variant uppercase tracking-wider">Start Date</label>
                  <input 
                    type="date" required value={leaveStart} onChange={e => setLeaveStart(e.target.value)} 
                    className="w-full bg-surface-container-low border border-outline-variant text-on-surface px-3 py-2.5 rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm transition-all" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-label-caps text-xs text-on-surface-variant uppercase tracking-wider">End Date</label>
                  <input 
                    type="date" required value={leaveEnd} onChange={e => setLeaveEnd(e.target.value)} 
                    className="w-full bg-surface-container-low border border-outline-variant text-on-surface px-3 py-2.5 rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm transition-all" 
                  />
                </div>
              </div>
              
              <div className="space-y-1">
                <label className="font-label-caps text-xs text-on-surface-variant uppercase tracking-wider">Reason (Optional)</label>
                <input 
                  type="text" placeholder="e.g. Medical Appointment" value={leaveReason} onChange={e => setLeaveReason(e.target.value)} 
                  className="w-full bg-surface-container-low border border-outline-variant text-on-surface px-3 py-2.5 rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm transition-all" 
                />
              </div>
              
              <button 
                type="submit" disabled={leaveBusy} 
                className="w-full bg-surface-container-highest border border-outline-variant text-on-surface font-bold py-3 mt-2 rounded-lg uppercase tracking-wider hover:border-primary hover:text-primary transition-all disabled:opacity-50 btn-push"
              >
                {leaveBusy ? "Submitting..." : "Submit Request"}
              </button>
            </form>
          </div>

          <div className="lg:col-span-7 bg-surface-container border border-outline-variant rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead className="bg-surface-container-highest border-b border-outline-variant">
                <tr>
                  <th className="px-4 py-3 font-label-caps text-xs text-on-surface-variant tracking-wider">DATES</th>
                  <th className="px-4 py-3 font-label-caps text-xs text-on-surface-variant tracking-wider">REASON</th>
                  <th className="px-4 py-3 font-label-caps text-xs text-on-surface-variant tracking-wider text-right">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {leaves.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="p-8 text-center text-on-surface-variant/50 text-sm">
                      No leave requests submitted yet.
                    </td>
                  </tr>
                ) : (
                  leaves.map(l => (
                    <tr key={l.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-4 font-body-md text-sm text-on-surface">
                        {dateLabel(l.start_date)} {l.start_date !== l.end_date ? `to ${dateLabel(l.end_date)}` : ''}
                      </td>
                      <td className="px-4 py-4 font-body-md text-sm text-on-surface-variant">{l.reason || "—"}</td>
                      <td className="px-4 py-4 text-right">
                        {l.status === 'approved' && <span className="inline-flex items-center px-2 py-0.5 bg-[#1a2e21] text-[#4edea3] font-label-caps text-[10px] rounded border border-secondary/30">Approved</span>}
                        {l.status === 'rejected' && <span className="inline-flex items-center px-2 py-0.5 bg-error-container/20 text-error font-label-caps text-[10px] rounded border border-error/30">Rejected</span>}
                        {l.status === 'pending' && <span className="inline-flex items-center px-2 py-0.5 bg-surface-container-highest text-on-surface-variant font-label-caps text-[10px] rounded border border-outline-variant">Pending Admin</span>}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
    </div>
  );
}
