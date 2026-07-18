import { useEffect, useState, useCallback } from "react";
import client, { apiErrorMessage } from "../api/client";
import { useAuth } from "../context/AuthContext";

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
      // non-fatal — the mark button still works even if history fails to load
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  // Fix: Generate date strings using the user's localized zone properties to prevent calculation mismatch lags
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
      
      setInfo(`${label} at ${timeLabel(res.data.timestamp)} — ${Math.round(res.data.distance_m)}m from site.`);
      
      // Instantly refresh array variables to execute immediate re-rendering cycles
      await loadHistory();
    } catch (err) {
      setError(apiErrorMessage(err, "Could not mark attendance. Please allow location access and try again."));
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <div className="loading-wrap"><span className="spinner"></span> Loading…</div>;
  }

  if (!user.site_id) {
    return (
      <>
        <h1>Hi, {user.name.split(" ")[0]}</h1>
        <p className="subtitle">Your account</p>
        <div className="card">
          <div className="error-box">
            You haven't been assigned to a site yet. Ask your admin to assign one before you can check in.
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <h1>Hi, {user.name.split(" ")[0]}</h1>
      <p className="subtitle">{user.site_name}</p>

      <div className="card" style={{ textAlign: "center" }}>
        <div className="row-between" style={{ justifyContent: "center" }}>
          {done ? (
            <span className="status-badge out"><span className="dot"></span>Checked out {timeLabel(hasOut.timestamp)}</span>
          ) : hasIn ? (
            <span className="status-badge in"><span className="dot"></span>Checked in {timeLabel(hasIn.timestamp)}</span>
          ) : (
            <span className="status-badge none"><span className="dot"></span>Not checked in</span>
          )}
        </div>

        {error && <div className="error-box">{error}</div>}
        {info && <div className="success-box">{info}</div>}

        <button
          className={`mark-circle ${willCheckout ? "checkout" : ""}`}
          onClick={handleMark}
          disabled={done || busy}
        >
          {busy ? (
            <span className="spinner"></span>
          ) : done ? (
            <><span className="big">DONE</span><span className="small">for today</span></>
          ) : willCheckout ? (
            <><span className="big">CHECK OUT</span><span className="small">tap to mark</span></>
          ) : (
            <><span className="big">CHECK IN</span><span className="small">tap to mark</span></>
          )}
        </button>
        <div className="geo-line">📍 We'll check you're within range of {user.site_name}</div>
      </div>

      <h3 style={{ marginTop: 26 }}>Recent activity</h3>
      <div className="card card-flush">
        {history.length === 0 ? (
          <div className="empty-state">No attendance marked yet.</div>
        ) : (
          <table>
            <thead><tr><th>Date</th><th>Type</th><th>Time</th><th>Distance</th></tr></thead>
            <tbody>
              {history.slice(0, 12).map((r) => (
                <tr key={r.id}>
                  <td>{dateLabel(r.record_date)}</td>
                  <td>
                    {(r.type === "check_in" || r.type === "in")
                      ? <span className="status-badge in"><span className="dot"></span>In</span>
                      : <span className="status-badge out"><span className="dot"></span>Out</span>}
                  </td>
                  <td>{timeLabel(r.timestamp)}</td>
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
