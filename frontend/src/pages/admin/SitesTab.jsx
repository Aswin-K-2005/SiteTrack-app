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
    // Add a safety check!
    if (!window.confirm("Are you sure you want to archive this site? Workers will be unassigned, but attendance logs will be saved.")) {
        return;
    }
    try {
      await client.delete(`/sites/${id}`);
      setSuccess("Site successfully archived.");
      await load();
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-on-surface-variant font-headline-sm text-lg gap-3">
        <span className="animate-spin rounded-full h-5 w-5 border-2 border-primary-container border-t-transparent"></span>
        FETCHING GEOFENCE REGISTRY...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {error && <div className="bg-error-container/20 border-l-4 border-error p-4 text-sm text-error font-bold">{error}</div>}
      {success && <div className="bg-[#1a2e21] border-l-4 border-secondary p-4 text-sm text-[#4edea3] font-bold">{success}</div>}

      {/* Form Card */}
      <div className="bg-surface-container rounded-xl border border-outline-variant p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-primary-container"></div>
        <h3 className="font-headline-md text-xl text-on-surface uppercase tracking-wide mb-6">Add a Site</h3>
        
        <form onSubmit={handleAdd} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="siteName" className="font-label-caps text-xs text-on-surface-variant uppercase tracking-wider block">Site Name</label>
            <input 
              id="siteName" type="text" placeholder="e.g. Riverside Tower — Block B" value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-surface-container-low border border-outline-variant text-on-surface px-4 py-3 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-on-surface-variant/40"
            />
          </div>

          <div className="space-y-2">
            <LocationPicker value={pin} radius={Number(radius) || 150} onChange={(lat, lng) => setPin({ lat, lng })} />
          </div>

          <div className="space-y-2">
            <label htmlFor="siteRadius" className="font-label-caps text-xs text-on-surface-variant uppercase tracking-wider block">Geofence Radius (Meters)</label>
            <input 
              id="siteRadius" type="number" min="20" max="2000" value={radius}
              onChange={(e) => setRadius(e.target.value)}
              className="w-full bg-surface-container-low border border-outline-variant text-on-surface px-4 py-3 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
            />
            <p className="text-[11px] text-on-surface-variant/70 italic">Workers must be within this targeted distance radius perimeter to execute attendance check cycles.</p>
          </div>

          <button type="submit" disabled={busy} className="w-full bg-primary-container text-on-primary font-bold py-4 rounded-lg text-lg uppercase tracking-wider hover:brightness-110 active:scale-[0.98] transition-all shadow-lg shadow-primary-container/10">
            {busy ? "Adding System Geofence..." : "Create Boundary Target"}
          </button>
        </form>
      </div>

      {/* List Registry Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <h2 className="font-headline-sm text-xl text-on-surface uppercase tracking-wider">All Active Sites</h2>
          <span className="bg-surface-container-highest px-2 py-0.5 rounded text-on-surface text-sm font-bold">({sites.length})</span>
        </div>

        <div className="space-y-3">
          {sites.length === 0 ? (
            <div className="bg-surface-container border border-outline-variant p-8 rounded-xl text-center text-on-surface-variant/50 text-sm">No construction boundary layouts mapped to registry databases yet.</div>
          ) : (
            sites.map((s) => (
              <div className="group flex justify-between items-center bg-surface-container-high border border-outline-variant p-4 rounded-lg hover:border-primary/40 transition-colors" key={s.id}>
                <div className="flex gap-4 items-center">
                  <div className="w-12 h-12 rounded bg-surface-container-highest flex items-center justify-center border border-outline-variant">
                    <span className="text-primary-container font-bold font-label-caps text-xs">ZONE</span>
                  </div>
                  <div>
                    <h3 className="font-headline-sm text-base text-on-surface font-bold">{s.name}</h3>
                    <p className="font-body-md text-xs text-on-surface-variant">
                      {s.latitude.toFixed(5)}, {s.longitude.toFixed(5)} • {s.radius_m}m radius perimeter
                    </p>
                  </div>
                </div>
            <button 
              onClick={() => handleDelete(s.id)}
        className="bg-surface-container-low border border-outline-variant text-on-surface-variant hover:text-warning hover:border-warning/40 px-4 py-2 rounded font-label-caps text-xs uppercase tracking-wider transition-all active:scale-95"
        >
        Archive
        </button>         
          </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
