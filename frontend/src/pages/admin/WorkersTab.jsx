import { useEffect, useState, useCallback } from "react";
import client, { apiErrorMessage } from "../../api/client";

export default function WorkersTab() {
  const [workers, setWorkers] = useState([]);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // FIX: Changed site_id to site_ids array
  const [form, setForm] = useState({ name: "", username: "", password: "", site_ids: [] });
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [w, s] = await Promise.all([client.get("/users"), client.get("/sites")]);
    setWorkers(w.data);
    setSites(s.data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleAdd(e) {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!form.name.trim() || !form.username.trim() || !form.password) {
      setError("Fill in name, username, and a temporary password.");
      return;
    }
    setBusy(true);
    try {
      await client.post("/users", {
        name: form.name.trim(),
        username: form.username.trim().toLowerCase(),
        password: form.password,
        site_ids: form.site_ids, // FIX: Pass the array of IDs to the backend
      });
      setSuccess(`Added ${form.name}. Share username "${form.username.trim().toLowerCase()}" and the temporary password with them.`);
      setForm({ name: "", username: "", password: "", site_ids: [] });
      await load();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleReset(id) {
    setError(""); setSuccess("");
    try {
      const res = await client.post(`/users/${id}/reset-password`);
      setSuccess(`Password reset for ${res.data.username}. New temporary password: ${res.data.temporary_password}`);
      await load();
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  async function handleDelete(id, name) {
    setError(""); setSuccess("");
    if (!window.confirm(`Are you absolutely sure you want to completely delete worker "${name}"?`)) {
      return;
    }
    try {
      await client.delete(`/users/${id}`);
      setSuccess(`Successfully removed worker "${name}" from the system registry.`);
      await load();
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  // FIX: Update the search filter to map over the sites array
  const filteredWorkers = workers.filter(w => {
    const siteNames = w.sites?.map(s => s.name).join(" ") || "unassigned";
    const matchString = `${w.name} ${w.username} ${siteNames} ${w.id}`.toLowerCase();
    return matchString.includes(searchTerm.toLowerCase());
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-on-surface-variant font-headline-sm text-lg gap-3">
        <span className="animate-spin rounded-full h-5 w-5 border-2 border-primary-container border-t-transparent"></span>
        FETCHING SYSTEM PERSONNEL REGISTRY...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {error && <div className="bg-error-container/20 border-l-4 border-error p-4 text-sm text-error font-bold">{error}</div>}
      {success && <div className="bg-[#1a2e21] border-l-4 border-secondary p-4 text-sm text-[#4edea3] font-bold">{success}</div>}

      {/* Add Worker Form Card */}
      <div className="bg-surface-container rounded-xl border border-outline-variant p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-primary-container"></div>
        <h3 className="font-headline-md text-xl text-on-surface uppercase tracking-wide mb-6">Register Personnel</h3>
        
        <form onSubmit={handleAdd} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="empName" className="font-label-caps text-xs text-on-surface-variant uppercase tracking-wider block">Full Name</label>
              <input
                id="empName" type="text" placeholder="e.g. John Smith" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-surface-container-low border border-outline-variant text-on-surface px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-on-surface-variant/30"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="empUser" className="font-label-caps text-xs text-on-surface-variant uppercase tracking-wider block">Username</label>
              <input
                id="empUser" type="text" placeholder="e.g. jsmith" value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="w-full bg-surface-container-low border border-outline-variant text-on-surface px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-on-surface-variant/30"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="empPass" className="font-label-caps text-xs text-on-surface-variant uppercase tracking-wider block">Temporary Password</label>
              <input
                id="empPass" type="text" placeholder="e.g. Welcome123" value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full bg-surface-container-low border border-outline-variant text-on-surface px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-on-surface-variant/30"
              />
            </div>
            
            {/* FIX: Replaced Select Dropdown with Checkbox List */}
            <div className="space-y-1">
              <label className="font-label-caps text-xs text-on-surface-variant uppercase tracking-wider block">Assign to Sites</label>
              <div className="max-h-32 overflow-y-auto bg-surface-container-low border border-outline-variant rounded-lg p-2 space-y-2">
                {sites.length === 0 ? (
                    <p className="text-xs text-on-surface-variant p-2">No sites available.</p>
                ) : (
                    sites.map((s) => (
                    <label key={s.id} className="flex items-center gap-2 text-sm cursor-pointer text-on-surface">
                        <input
                            type="checkbox"
                            value={s.id}
                            checked={form.site_ids.includes(s.id)}
                            onChange={(e) => {
                                const id = Number(e.target.value);
                                if (e.target.checked) {
                                    setForm({ ...form, site_ids: [...form.site_ids, id] });
                                } else {
                                    setForm({ ...form, site_ids: form.site_ids.filter(sid => sid !== id) });
                                }
                            }}
                            className="accent-primary-container w-4 h-4"
                        />
                        {s.name}
                    </label>
                    ))
                )}
              </div>
            </div>
          </div>
          
          <button type="submit" disabled={busy} className="w-full bg-primary-container text-on-primary font-bold py-3 rounded-lg uppercase tracking-wider hover:brightness-110 active:scale-[0.99] transition-all disabled:opacity-50">
            {busy ? "Registering..." : "Register Worker Profile"}
          </button>
        </form>
      </div>

      {/* Control Search Element Bar */}
      <section className="bg-surface-container-high p-4 border border-outline-variant rounded-t-xl flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <input
             className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg pl-4 pr-4 py-2 font-body-md text-on-surface placeholder:text-on-surface-variant/40 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm"
             placeholder="Search workers by name, site, or login ID..."
             type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="text-xs font-label-caps text-on-surface-variant tracking-wider">
          MATCHES FOUND: {filteredWorkers.length}
        </div>
      </section>

      {/* Main Registry Personnel Data Table Container */}
      <section className="border border-t-0 border-outline-variant rounded-b-xl overflow-hidden bg-surface-container-low">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-highest/50 border-b border-outline-variant">
                <th className="px-6 py-4 font-label-caps text-xs text-on-surface-variant uppercase tracking-wider">Worker Details</th>
                <th className="px-6 py-4 font-label-caps text-xs text-on-surface-variant uppercase tracking-wider">Assigned Sites</th>
                <th className="px-6 py-4 font-label-caps text-xs text-on-surface-variant uppercase tracking-wider text-center">Lifecycle Status</th>
                <th className="px-6 py-4 font-label-caps text-xs text-on-surface-variant uppercase tracking-wider text-right">System Configuration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {filteredWorkers.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-on-surface-variant/50 text-sm">No personnel directory profiles match active parameters.</td>
                </tr>
              ) : (
                filteredWorkers.map((w) => (
                  <tr key={w.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-body-md font-bold text-on-surface text-sm">{w.name}</p>
                        <p className="text-[10px] text-on-surface-variant font-label-caps">@{w.username}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {/* FIX: Render multiple site names */}
                      {w.sites && w.sites.length > 0 ? (
                        <span className="text-on-surface font-medium">{w.sites.map(s => s.name).join(", ")}</span>
                      ) : (
                        <span className="text-on-surface-variant/50 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {w.must_change_password ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-tertiary-container/10 border border-tertiary/30 text-tertiary font-label-caps text-[10px] uppercase tracking-wider">
                          New Profile
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-secondary-container/10 border border-secondary/30 text-secondary font-label-caps text-[10px] uppercase tracking-wider">
                          Active Sync
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                           onClick={() => handleReset(w.id)}
                          className="px-3 py-1.5 text-xs font-label-caps border border-outline hover:border-primary hover:text-primary transition-all rounded"
                          title="Reset System Password"
                        >
                          Reset Pass
                        </button>
                        {w.username !== "admin" && (
                          <button
                             onClick={() => handleDelete(w.id, w.name)}
                            className="px-3 py-1.5 text-xs font-label-caps bg-error-container/20 border border-error/30 text-error hover:bg-error hover:text-on-error transition-all rounded"
                            title="Purge Profile Registry"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
