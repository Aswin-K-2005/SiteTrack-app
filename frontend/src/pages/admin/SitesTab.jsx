import { useEffect, useState, useCallback } from "react";
import client, { apiErrorMessage } from "../../api/client";
import LocationPicker from "../../components/LocationPicker";

export default function SitesTab() {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [radius, setRadius] = useState(150);
  const [pin, setPin] = useState(null); // {lat, lng}
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await client.get("/sites");
    setSites(res.data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleAdd(e) {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!name.trim() || !pin) {
      setError("Give the site a name and drop a pin on the map for its location.");
      return;
    }
    setBusy(true);
    try {
      await client.post("/sites", {
        name: name.trim(),
        latitude: pin.lat,
        longitude: pin.lng,
        radius_m: Number(radius) || 150,
      });
      setSuccess(`Added site "${name.trim()}".`);
      setName(""); setPin(null); setRadius(150);
      await load();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id) {
    setError(""); setSuccess("");
    try {
      await client.delete(`/sites/${id}`);
      setSuccess("Site removed.");
      await load();
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  if (loading) return <div className="loading-wrap"><span className="spinner"></span> Loading…</div>;

  return (
    <>
      {error && <div className="error-box">{error}</div>}
      {success && <div className="success-box">{success}</div>}

      <div className="card">
        <h3>Add a site</h3>
        <form onSubmit={handleAdd}>
          <label htmlFor="siteName">Site name</label>
          <input id="siteName" type="text" placeholder="e.g. Riverside Tower — Block B" value={name}
            onChange={(e) => setName(e.target.value)} />

          <LocationPicker value={pin} radius={Number(radius) || 150} onChange={(lat, lng) => setPin({ lat, lng })} />

          <label htmlFor="siteRadius">Geofence radius (meters)</label>
          <input id="siteRadius" type="number" min="20" max="2000" value={radius}
            onChange={(e) => setRadius(e.target.value)} />
          <div className="hint">Workers must be within this distance of the pin to mark attendance.</div>

          <div style={{ marginTop: 16 }}>
            <button className="btn" type="submit" disabled={busy}>{busy ? "Adding…" : "Add site"}</button>
          </div>
        </form>
      </div>

      <h3>All sites ({sites.length})</h3>
      <div className="card card-flush">
        {sites.length === 0 ? (
          <div className="empty-state">No sites yet. Add one above.</div>
        ) : (
          sites.map((s) => (
            <div className="list-item row-between" key={s.id}>
              <div>
                <div className="list-item-title">{s.name}</div>
                <div className="list-item-sub">{s.latitude.toFixed(5)}, {s.longitude.toFixed(5)} · {s.radius_m}m radius</div>
              </div>
              <button className="btn-logout" onClick={() => handleDelete(s.id)}>Remove</button>
            </div>
          ))
        )}
      </div>
    </>
  );
}
