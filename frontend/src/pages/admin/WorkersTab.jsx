import { useEffect, useState, useCallback } from "react";
import client, { apiErrorMessage } from "../../api/client";

export default function WorkersTab() {
  const [workers, setWorkers] = useState([]);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Edit State
  const [editingId, setEditingId] = useState(null);
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

  async function handleSubmit(e) {
    e.preventDefault();
    setError(""); setSuccess("");
    
    // If creating new user, password is required. If editing, we ignore the password field.
    if (!form.name.trim() || !form.username.trim() || (!editingId && !form.password)) {
      setError("Fill in all required fields.");
      return;
    }
    setBusy(true);
    try {
      if (editingId) {
        await client.put(`/users/${editingId}`, {
          name: form.name.trim(),
          username: form.username.trim().toLowerCase(),
          site_ids: form.site_ids,
        });
        setSuccess(`Worker profile for "${form.name.trim()}" updated successfully.`);
      } else {
        await client.post("/users", {
          name: form.name.trim(),
          username: form.username.trim().toLowerCase(),
          password: form.password,
          site_ids: form.site_ids,
        });
        setSuccess(`Added ${form.name}. Share username "${form.username.trim().toLowerCase()}" and the password with them.`);
      }
      resetForm();
      await load();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  function handleEditClick(worker) {
    setError(""); setSuccess("");
    setEditingId(worker.id);
    setForm({
      name: worker.name,
      username: worker.username,
      password: "", // Password is unchanged via edit (Reset Pass button handles that)
      site_ids: worker.sites.map(s => s.id)
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setEditingId(null);
    setForm({ name: "", username: "", password: "", site_ids: [] });
    setError("");
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

  const filteredWorkers = workers.filter(w => {
    const siteNames = w.sites?.map(s => s.name).join(" ") || "unassigned";
    const matchString = `${w.name} ${w.username} ${siteNames} ${w.id}`.toLowerCase();
    return matchString.includes(searchTerm.toLowerCase());
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-secondary font-mono-data text-lg gap-3">
        <span className="animate-spin rounded-none h-5 w-5 border-2 border-primary border-t-transparent"></span>
        FETCHING SYSTEM PERSONNEL REGISTRY...
      </div>
    );
  }

  return (
    <div className="space-y-8 bg-surface-dim pb-12">
      {error && <div className="bg-error-container border-l-4 border-error p-4 text-sm text-on-error-container font-bold">{error}</div>}
      {success && <div className="bg-[#1a2e21] border-l-4 border-secondary p-4 text-sm text-[#4edea3] font-bold">{success}</div>}

      {/* Header Section from your mockup */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8 border-b-2 border-secondary-container pb-6">
        <div>
          <h1 className="font-headline-lg text-4xl text-on-surface uppercase tracking-tight">Personnel Directory</h1>
          <p className="font-mono-data text-secondary mt-2">Active Site Authorization: Level 4 | System Sync Verified</p>
        </div>
        <div className="w-full md:w-96">
          <label className="font-label-caps text-xs text-on-surface-variant mb-2 block tracking-widest">Mechanical Search</label>
          <div className="relative">
            <input 
              className="w-full bg-surface-container-lowest border-2 border-secondary-container text-on-surface px-4 py-3 focus:border-primary focus:ring-0 outline-none font-mono-data transition-colors" 
              placeholder="ID NO. / SURNAME / SITE" 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <span className="material-symbols-outlined absolute right-3 top-3 text-secondary">search</span>
          </div>
        </div>
      </div>

      {/* Bento Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="border-2 border-secondary-container bg-surface-container p-4">
          <div className="font-label-caps text-xs tracking-widest text-secondary mb-2">Total Staff</div>
          <div className="font-headline-md text-3xl text-on-surface">{workers.length}</div>
        </div>
        <div className="border-2 border-secondary-container bg-surface-container p-4 border-l-primary border-l-4">
          <div className="font-label-caps text-xs tracking-widest text-primary mb-2">Matches Found</div>
          <div className="font-headline-md text-3xl text-primary">{filteredWorkers.length}</div>
        </div>
        <div className="border-2 border-secondary-container bg-surface-container p-4">
          <div className="font-label-caps text-xs tracking-widest text-secondary mb-2">Transit / Leave</div>
          <div className="font-headline-md text-3xl text-on-surface">--</div>
        </div>
        <div className="border-2 border-secondary-container bg-surface-container p-4">
          <div className="font-label-caps text-xs tracking-widest text-secondary mb-2">System Alerts</div>
          <div className="font-headline-md text-3xl text-on-surface">00</div>
        </div>
      </div>

      {/* Dynamic Form Card (Create / Edit) */}
      <div className="bg-surface-container border-2 border-secondary-container p-6 relative overflow-hidden shadow-lg">
        <div className={`absolute top-0 left-0 w-full h-1 ${editingId ? 'bg-secondary' : 'bg-primary-container'}`}></div>
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-headline-md text-xl text-on-surface uppercase tracking-wide">
            {editingId ? "Edit Personnel Profile" : "Register Personnel"}
          </h3>
          {editingId && (
            <span className="bg-secondary-container/20 text-secondary font-label-caps text-xs px-3 py-1 border border-secondary/30">
              Editing Mode Active
            </span>
          )}
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="empName" className="font-label-caps text-xs text-on-surface-variant uppercase tracking-wider block">Full Name</label>
              <input
                id="empName" type="text" placeholder="e.g. John Smith" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-surface-container-low border-2 border-secondary-container text-on-surface px-4 py-2.5 focus:border-primary outline-none transition-all font-mono-data"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="empUser" className="font-label-caps text-xs text-on-surface-variant uppercase tracking-wider block">Username</label>
              <input
                id="empUser" type="text" placeholder="e.g. jsmith" value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="w-full bg-surface-container-low border-2 border-secondary-container text-on-surface px-4 py-2.5 focus:border-primary outline-none transition-all font-mono-data"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {!editingId ? (
              <div className="space-y-1">
                <label htmlFor="empPass" className="font-label-caps text-xs text-on-surface-variant uppercase tracking-wider block">Temporary Password</label>
                <input
                  id="empPass" type="text" placeholder="e.g. Welcome123" value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full bg-surface-container-low border-2 border-secondary-container text-on-surface px-4 py-2.5 focus:border-primary outline-none transition-all font-mono-data"
                />
              </div>
            ) : (
              <div className="flex flex-col justify-center text-sm text-on-surface-variant italic p-2 font-mono-data">
                Password updates are handled via the Reset Key action.
              </div>
            )}
            
            <div className="space-y-1">
              <label className="font-label-caps text-xs text-on-surface-variant uppercase tracking-wider block">Assign to Sites</label>
              <div className="max-h-32 overflow-y-auto bg-surface-container-low border-2 border-secondary-container p-2 space-y-2 font-mono-data">
                {sites.length === 0 ? (
                    <p className="text-xs text-on-surface-variant p-2">No active sites available.</p>
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
          
          <div className="flex gap-4 pt-2">
            {editingId && (
              <button 
                type="button" 
                onClick={resetForm}
                disabled={busy}
                className="w-1/3 bg-surface-container border-2 border-secondary-container text-on-surface font-label-caps py-3 uppercase tracking-wider hover:bg-surface-container-high transition-all disabled:opacity-50 btn-push"
              >
                Cancel
              </button>
            )}
            <button 
              type="submit" 
              disabled={busy} 
              className={`${editingId ? 'w-2/3 bg-secondary text-on-secondary' : 'w-full bg-primary-container text-on-primary-container'} border-2 border-primary-container font-label-caps py-3 uppercase tracking-wider hover:brightness-110 transition-all disabled:opacity-50 btn-push`}
            >
              {busy ? "Processing..." : (editingId ? "Save Profile Updates" : "Register Worker Profile")}
            </button>
          </div>
        </form>
      </div>

      {/* Main Registry Personnel Data Table */}
      <div className="border-2 border-secondary-container bg-surface overflow-x-auto">
        <table className="industrial-table">
          <thead className="bg-surface-container-low text-left">
            <tr>
              <th className="px-6 py-4 font-label-caps text-xs text-on-surface-variant tracking-wider">Worker Identification</th>
              <th className="px-6 py-4 font-label-caps text-xs text-on-surface-variant tracking-wider">Designation / Sites</th>
              <th className="px-6 py-4 font-label-caps text-xs text-on-surface-variant tracking-wider text-center">Lifecycle Status</th>
              <th className="px-6 py-4 font-label-caps text-xs text-on-surface-variant tracking-wider text-right">Protocol Actions</th>
            </tr>
          </thead>
          <tbody className="font-mono-data text-sm text-on-surface">
            {filteredWorkers.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-6 py-8 text-center text-secondary">No personnel profiles match active parameters.</td>
              </tr>
            ) : (
              filteredWorkers.map((w) => (
                <tr key={w.id} className={`hover:bg-surface-container-high transition-colors hover:border-l-4 hover:border-l-primary border-l-4 border-transparent ${editingId === w.id ? 'bg-secondary/10 border-l-secondary' : ''}`}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 border-2 border-secondary-container bg-surface-container-highest flex items-center justify-center text-primary font-bold">
                        {w.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold uppercase font-headline-sm tracking-wide">{w.name}</div>
                        <div className="text-xs text-on-surface-variant">UID: {w.username}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-secondary">
                    {w.sites && w.sites.length > 0 ? w.sites.map(s => s.name).join(", ") : "UNASSIGNED"}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {w.must_change_password ? (
                      <span className="border border-error text-error px-2 py-0.5 text-xs">NEW PROFILE</span>
                    ) : (
                      <span className="border border-primary text-primary px-2 py-0.5 text-xs">ACTIVE SYNC</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleEditClick(w)} className="text-secondary hover:text-primary transition-colors btn-push" title="Edit Profile">
                        <span className="material-symbols-outlined">edit</span>
                      </button>
                      <button onClick={() => handleReset(w.id)} className="text-secondary hover:text-primary transition-colors btn-push" title="Reset Key">
                        <span className="material-symbols-outlined">key</span>
                      </button>
                      {w.username !== "admin" && (
                        <button onClick={() => handleDelete(w.id, w.name)} className="text-secondary hover:text-error transition-colors btn-push" title="Purge Profile">
                          <span className="material-symbols-outlined">delete</span>
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
    </div>
  );
}
