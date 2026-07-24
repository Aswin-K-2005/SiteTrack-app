import { useEffect, useState, useCallback } from "react";
import client, { apiErrorMessage } from "../../api/client";

export default function HolidaysTab() {
  const [holidays, setHolidays] = useState([]);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [siteId, setSiteId] = useState(""); // empty means company-wide
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [holidaysRes, sitesRes] = await Promise.all([
        client.get("/holidays"),
        client.get("/sites")
      ]);
      setHolidays(holidaysRes.data);
      setSites(sitesRes.data.filter(s => !s.is_archived));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleAdd(e) {
    e.preventDefault();
    setError(""); setSuccess("");
    
    if (!title.trim() || !date) {
      setError("Please provide a title and select a date.");
      return;
    }
    
    setBusy(true);
    try {
      await client.post("/holidays", {
        title: title.trim(),
        holiday_date: date,
        site_id: siteId ? Number(siteId) : null,
      });
      setSuccess(`Holiday "${title.trim()}" successfully declared.`);
      setTitle(""); setDate(""); setSiteId("");
      await load();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (loading && holidays.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-on-surface-variant font-headline-sm text-lg gap-3">
        <span className="animate-spin rounded-full h-5 w-5 border-2 border-primary-container border-t-transparent"></span>
        FETCHING SCHEDULE REGISTRY...
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
        <h3 className="font-headline-md text-xl text-on-surface uppercase tracking-wide mb-6">Declare a Holiday</h3>
        
        <form onSubmit={handleAdd} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="font-label-caps text-xs text-on-surface-variant uppercase tracking-wider block">Holiday Title</label>
              <input
                type="text" placeholder="e.g. Monsoon Safety Break" value={title}
                onChange={(e) => setTitle(e.target.value)}
                /* THE FIX: Swapped py-2.5 for a strict h-[46px] */
                className="w-full h-[46px] bg-surface-container-low border border-outline-variant text-on-surface px-4 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-on-surface-variant/30 text-sm appearance-none"
              />
            </div>
            
            <div className="space-y-1">
              <label className="font-label-caps text-xs text-on-surface-variant uppercase tracking-wider block">Date</label>
              <input
                type="date" value={date}
                onChange={(e) => setDate(e.target.value)}
                /* THE FIX: Added h-[46px] and appearance-none to stop iOS stretching */
                className="w-full h-[46px] bg-surface-container-low border border-outline-variant text-on-surface px-4 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm appearance-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-label-caps text-xs text-on-surface-variant uppercase tracking-wider block">Target Site</label>
              <select
                value={siteId} onChange={(e) => setSiteId(e.target.value)}
                /* THE FIX: Added h-[46px] to perfectly match the other two boxes */
                className="w-full h-[46px] bg-surface-container-low border border-outline-variant text-on-surface px-4 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm"
              >
                <option value="">Company-Wide (All Sites)</option>
                {sites.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>
          
          <button type="submit" disabled={busy} className="w-full md:w-auto px-8 bg-primary-container text-on-primary font-bold py-3 mt-2 rounded-lg uppercase tracking-wider hover:brightness-110 active:scale-[0.99] transition-all disabled:opacity-50 float-right">
            {busy ? "Processing..." : "Declare Holiday"}
          </button>
          <div className="clear-both"></div>
        </form>
      </div>

      {/* List Registry Section */}
      <div className="space-y-4">
        <h2 className="font-headline-sm text-xl text-on-surface uppercase tracking-wider">Upcoming Schedule</h2>
        
        <div className="bg-surface-container border border-outline-variant rounded-xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-surface-container-highest border-b border-outline-variant">
              <tr>
                <th className="px-4 py-3 font-label-caps text-xs text-on-surface-variant tracking-wider">DATE</th>
                <th className="px-4 py-3 font-label-caps text-xs text-on-surface-variant tracking-wider">TITLE</th>
                <th className="px-4 py-3 font-label-caps text-xs text-on-surface-variant tracking-wider">SCOPE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {holidays.length === 0 ? (
                <tr>
                  <td colSpan="3" className="p-8 text-center text-on-surface-variant/50 text-sm">No holidays registered in the system.</td>
                </tr>
              ) : (
                holidays.map((h) => {
                  const siteTarget = h.site_id ? sites.find(s => s.id === h.site_id)?.name : "Company-Wide";
                  return (
                    <tr key={h.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-4 font-body-md text-sm font-bold text-on-surface">
                        {new Date(h.holiday_date).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
                      </td>
                      <td className="px-4 py-4 font-body-md text-sm text-on-surface-variant">{h.title}</td>
                      <td className="px-4 py-4">
                        {h.site_id ? (
                          <span className="inline-flex items-center px-2 py-0.5 bg-surface-container-highest text-on-surface-variant font-label-caps text-[10px] rounded border border-outline-variant">{siteTarget}</span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 bg-secondary-container/20 text-secondary font-label-caps text-[10px] rounded border border-secondary/30">Company-Wide</span>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
