import { useEffect, useState, useCallback } from "react";
import client, { apiErrorMessage } from "../../api/client";

export default function WorkersTab() {
  const [workers, setWorkers] = useState([]);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", username: "", password: "", site_id: "" });
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
        site_id: form.site_id ? Number(form.site_id) : null,
      });
      setSuccess(`Added ${form.name}. Share username "${form.username.trim().toLowerCase()}" and the temporary password with them.`);
      setForm({ name: "", username: "", password: "", site_id: "" });
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

  if (loading) return <div className="loading-wrap"><span className="spinner"></span> Loading…</div>;

  return (
    <>
      {error && <div className="error-box">{error}</div>}
      {success && <div className="success-box">{success}</div>}

      <div className="card">
        <h3>Add a worker</h3>
        <form onSubmit={handleAdd}>
          <label htmlFor="empName">Full name</label>
          <input id="empName" type="text" placeholder="e.g. John Smith" value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <label htmlFor="empUser">Username</label>
          <input id="empUser" type="text" placeholder="e.g. jsmith" value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })} />
          <label htmlFor="empPass">Temporary password</label>
          <input id="empPass" type="text" placeholder="e.g. Welcome123" value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <label htmlFor="empSite">Assign to site</label>
          <select id="empSite" value={form.site_id} onChange={(e) => setForm({ ...form, site_id: e.target.value })}>
            <option value="">— Select a site —</option>
            {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <div className="hint">
            {sites.length === 0 ? "Add a site first in the Sites tab." : "They'll be asked to set their own password on first login."}
          </div>
          <div style={{ marginTop: 16 }}>
            <button className="btn" type="submit" disabled={busy}>{busy ? "Adding…" : "Add worker"}</button>
          </div>
        </form>
      </div>

      <h3>All workers ({workers.length})</h3>
      <div className="card card-flush">
        {workers.length === 0 ? (
          <div className="empty-state">No workers yet.</div>
        ) : (
          workers.map((w) => (
            <div className="list-item row-between" key={w.id}>
              <div>
                <div className="list-item-title">{w.name}</div>
                <div className="list-item-sub">
                  @{w.username} · {w.site_name || "Unassigned"} {w.must_change_password ? "· awaiting first login" : ""}
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button className="btn-logout" onClick={() => handleReset(w.id)}>Reset password</button>
                {w.username !== "admin" && (
                  <button 
                    className="btn-logout" 
                    style={{ backgroundColor: "#dc2626", color: "#ffffff" }} 
                    onClick={() => handleDelete(w.id, w.name)}
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
