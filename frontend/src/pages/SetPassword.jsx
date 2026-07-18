import { useState } from "react";
import { useNavigate } from "react-router-dom";
import client, { apiErrorMessage } from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function SetPassword() {
  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { refresh, user } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (pw1.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (pw1 !== pw2) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      await client.post("/auth/change-password", { new_password: pw1 });
      await refresh();
      navigate("/");
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 w-full">
      <form className="bg-surface-container rounded-xl border border-outline-variant p-6 max-w-sm w-full relative overflow-hidden space-y-4" onSubmit={handleSubmit}>
        <div className="absolute top-0 left-0 w-full h-1 bg-primary-container"></div>
        
        <div>
          <h1 className="font-headline-lg text-2xl uppercase tracking-tight text-on-surface">Set Secure Passcode</h1>
          <p className="font-body-md text-xs text-on-surface-variant mt-1">
            {user ? `Welcome, ${user.name.split(" ")[0]}. ` : ""}
            Initialize a permanent access key for your worker ID.
          </p>
        </div>

        {error && <div className="bg-error-container/20 border-l-4 border-error p-3 text-xs text-error font-bold">{error}</div>}

        <div className="space-y-1">
          <label htmlFor="pw1" className="font-label-caps text-xs text-on-surface-variant uppercase tracking-wider block">New Password</label>
          <input 
            id="pw1" type="password" placeholder="Minimum 6 characters" value={pw1} onChange={(e) => setPw1(e.target.value)} 
            className="w-full bg-surface-container-low border border-outline-variant text-on-surface px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-on-surface-variant/30 text-sm"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="pw2" className="font-label-caps text-xs text-on-surface-variant uppercase tracking-wider block">Confirm Password</label>
          <input 
            id="pw2" type="password" placeholder="Re-enter password" value={pw2} onChange={(e) => setPw2(e.target.value)} 
            className="w-full bg-surface-container-low border border-outline-variant text-on-surface px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-on-surface-variant/30 text-sm"
          />
        </div>

        <button type="submit" disabled={busy} className="w-full bg-primary-container text-on-primary font-bold py-3 mt-2 rounded-lg uppercase tracking-wider hover:brightness-110 active:scale-[0.99] transition-all disabled:opacity-50">
          {busy ? "Saving Configuration..." : "Save & Synchronize"}
        </button>
      </form>
    </div>
  );
}
