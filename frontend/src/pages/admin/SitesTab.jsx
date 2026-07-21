import { useEffect, useState, useCallback } from "react";
import client, { apiErrorMessage } from "../../api/client";
import LocationPicker from "../../components/LocationPicker";

export default function SitesTab() {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // New States for Custom Modal & Archive System
  const [showArchived, setShowArchived] = useState(false);
  const [siteToArchive, setSiteToArchive] = useState(null); 
  
  const [name, setName] = useState("");
  const [radius, setRadius] = useState(150);
  const [pin, setPin] = useState(null); // {lat, lng}
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  // Dynamically load active OR archived sites based on the toggle
  const load = useCallback(async () => {
    try {
      setLoading(true);
      const endpoint = showArchived ? "/sites/archived" : "/sites";
      const res = await client.get(endpoint);
      setSites(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [showArchived]);

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

  // Triggered by the Custom Modal's "Yes" button
  async function confirmArchive() {
    if (!siteToArchive) return;
    setError(""); setSuccess("");
    setBusy(true);
    try {
      await client.delete(`/sites/${siteToArchive.id}`);
      setSuccess(`Site "${siteToArchive.name}" successfully archived.`);
      setSiteToArchive(null); // Close the modal
      await load();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  // Restore an archived site
  async function handleRestore(id) {
    setError(""); setSuccess("");
    try {
      await client.patch(`/sites/${id}/restore`);
      setSuccess("Site restored to active duty.");
      await load();
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  if (loading && sites.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-on-surface-variant font-headline-sm text-lg gap-3">
        <span className="animate-spin rounded-full h-5 w-5 border-2 border-primary-container border-t-transparent"></span>
        FETCHING GEOFENCE REGISTRY...
      </div>
    );
  }

  return (
    <div className="space-y-8 relative">
      {error && <div className="bg-error-container/20 border-l-4 border-error p-4 text-sm text-error font-bold">{error}</div>}
      {success && <div className="bg-[#1a2e21] border-l-4 border-secondary p-4 text-sm text-[#4edea3] font-bold">{success}</div>}

      {/* Form Card (Only show when viewing Active Sites) */}
      {!showArchived && (
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
      )}

      {/* List Registry Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-headline-sm text-xl text-on-surface uppercase tracking-wider">
              {showArchived ? "Archived Sites" : "Active Sites"}
            </h2>
            <span className="bg-surface-container-highest px-2 py-0.5 rounded text-on-surface text-sm font-bold">({sites.length})</span>
          </div>
          
          <button 
            onClick={() => setShowArchived(!showArchived)}
            className="text-xs font-label-caps tracking-wider border border-outline-variant px-4 py-2 rounded bg-surface-container hover:bg-surface-container-high transition-all text-on-surface"
          >
            {showArchived ? "View Active Sites" : "View Archived Sites"}
          </button>
        </div>

        <div className="space-y-3">
          {sites.length === 0 ? (
            <div className="bg-surface-container border border-outline-variant p-8 rounded-xl text-center text-on-surface-variant/50 text-sm">
              No construction boundary layouts found in this view.
            </div>
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
                      {s.latitude.toFixed(5)}, {s.longitude.toFixed(5)} • {s.radius_m}m radius
                    </p>
                  </div>
                </div>
                
                {showArchived ? (
                  <button 
                    onClick={() => handleRestore(s.id)}
                    className="bg-[#1a2e21] border border-secondary/30 text-[#4edea3] hover:brightness-110 px-4 py-2 rounded font-label-caps text-xs uppercase tracking-wider transition-all active:scale-95"
                  >
                    Restore
                  </button>
                ) : (
                  <button 
                    onClick={() => setSiteToArchive(s)}
                    className="bg-surface-container-low border border-outline-variant text-on-surface-variant hover:text-warning hover:border-warning/40 px-4 py-2 rounded font-label-caps text-xs uppercase tracking-wider transition-all active:scale-95"
                  >
                    Archive
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* CUSTOM UI MODAL FOR ARCHIVING */}
      {siteToArchive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface-container rounded-xl border border-outline-variant max-w-sm w-full p-6 shadow-2xl">
            <h3 className="font-headline-md text-xl text-on-surface uppercase mb-2">Confirm Archive</h3>
            <p className="text-sm text-on-surface-variant mb-6">
              Are you sure you want to archive <strong>{siteToArchive.name}</strong>? Workers will be unassigned, but historical attendance logs will be preserved.
            </p>
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setSiteToArchive(null)}
                disabled={busy}
                className="px-4 py-2 rounded font-label-caps text-xs tracking-wider border border-outline-variant text-on-surface hover:bg-surface-container-highest transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={confirmArchive}
                disabled={busy}
                className="px-4 py-2 rounded font-label-caps text-xs tracking-wider bg-warning text-black font-bold hover:brightness-110 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {busy && <span className="animate-spin rounded-full h-3 w-3 border-2 border-black border-t-transparent"></span>}
                Yes, Archive
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
