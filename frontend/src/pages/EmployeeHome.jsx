import { useEffect, useState, useCallback } from "react";
import client, { apiErrorMessage } from "../api/client";
import { useAuth } from "../context/AuthContext";

// Geolocation helper function
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
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const loadHistory = useCallback(async () => {
    try {
      const res = await client.get("/attendance/me");
      setHistory(res.data);
    } catch {
      // Non-fatal fallback
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadHistory(); }, [loadHistory]);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-on-surface-variant font-headline-sm text-lg gap-3 bg-background">
        <span className="animate-spin rounded-full h-5 w-5 border-2 border-primary-container border-t-transparent"></span>
        LOADING CANVAS...
      </div>
    );
  }

  return (
    <div className="flex-grow pt-24 pb-12 px-6 max-w-7xl mx-auto w-full font-body-md text-on-surface">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="font-headline-lg text-4xl text-on-surface uppercase tracking-tight">Mark Attendance</h1>
        <p className="font-body-md text-sm text-on-surface-variant mt-2">Confirm your site location and record your entry/exit.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Controls & Status */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Status Display Area */}
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

          {/* Feedback Messages */}
          {error && <div className="bg-error-container/20 border-l-4 border-error p-3 text-xs text-error">{error}</div>}
          {info && <div className="bg-[#1a2e21] border-l-4 border-secondary p-3 text-xs text-[#4edea3]">{info}</div>}

          {/* Site Specification Panel */}
          <div className="bg-surface-container border border-outline-variant p-4">
            <label className="font-label-caps text-xs tracking-wider text-on-surface-variant block mb-2">ASSIGNED CONSTRUCTION SITE</label>
            <div className="relative">
              <div className="w-full bg-surface-container-low border border-outline-variant text-on-surface font-body-md p-3 focus-within:border-primary-container pr-10">
                {user?.site_name || "No Site Assigned"}
              </div>
              <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant text-sm font-bold">LOCKED</span>
            </div>
          </div>

          {/* Industrial Action Triggers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => handleMark("in")}
              disabled={hasIn || busy}
              className="flex flex-col items-center justify-center gap-3 py-6 bg-primary-container text-on-primary font-bold transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed group relative overflow-hidden"
            >
              <span className="font-headline-sm text-lg uppercase tracking-wider">Check In</span>
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </button>

            <button
              onClick={() => handleMark("out")}
              disabled={!willCheckout || busy}
              className="flex flex-col items-center justify-center gap-3 py-6 border-2 border-outline-variant text-on-surface font-bold hover:border-error transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed group relative overflow-hidden"
            >
              <span className="font-headline-sm text-lg uppercase tracking-wider">Check Out</span>
              <div className="absolute inset-0 bg-error/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </button>
          </div>

          {/* Warning System Banner */}
          <div className="bg-surface-container-high border-l-4 border-tertiary p-4 flex gap-4">
            <div>
              <p className="font-body-md text-sm text-on-surface">You must be within the geofence boundary of your site to mark attendance.</p>
            </div>
          </div>
        </div>

        {/* Right Column: Active Log Table */}
        <div className="lg:col-span-7 space-y-4">
          <h2 className="font-headline-sm text-xl text-on-surface uppercase tracking-wider">Your Recent Activity</h2>
          <div className="overflow-x-auto bg-surface-container border border-outline-variant">
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
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-[#1a2e21] text-[#4edea3] font-label-caps text-[10px] rounded">IN</span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-error-container/20 text-error font-label-caps text-[10px] rounded">OUT</span>
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
  );
}
