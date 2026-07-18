import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiErrorMessage } from "../api/client";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!username || !password) {
      setError("Enter both a username and password.");
      return;
    }
    setBusy(true);
    try {
      const data = await login(username.trim(), password);
      navigate(data.must_change_password ? "/set-password" : "/");
    } catch (err) {
      setError(apiErrorMessage(err, "Incorrect username or password."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 w-full">
      <form className="bg-surface-container rounded-xl border border-outline-variant p-6 max-w-sm w-full relative overflow-hidden space-y-4" onSubmit={handleSubmit}>
        <div className="absolute top-0 left-0 w-full h-1 bg-primary-container"></div>
        
        <div>
          <h1 className="font-headline-lg text-3xl uppercase tracking-tight text-on-surface">Sign In</h1>
          <p className="font-body-md text-xs text-on-surface-variant mt-1">Enter the credentials assigned by your system supervisor.</p>
        </div>

        {error && <div className="bg-error-container/20 border-l-4 border-error p-3 text-xs text-error font-bold">{error}</div>}

        <div className="space-y-1">
          <label htmlFor="username" className="font-label-caps text-xs text-on-surface-variant uppercase tracking-wider block">Username</label>
          <input
            id="username" type="text" autoComplete="username" placeholder="e.g. jsmith"
            value={username} onChange={(e) => setUsername(e.target.value)}
            className="w-full bg-surface-container-low border border-outline-variant text-on-surface px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-on-surface-variant/30 text-sm"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="password" className="font-label-caps text-xs text-on-surface-variant uppercase tracking-wider block">Password</label>
          <input
            id="password" type="password" autoComplete="current-password" placeholder="••••••••"
            value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-surface-container-low border border-outline-variant text-on-surface px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-on-surface-variant/30 text-sm"
          />
        </div>

        <button type="submit" disabled={busy} className="w-full bg-primary-container text-on-primary font-bold py-3 mt-2 rounded-lg uppercase tracking-wider hover:brightness-110 active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
          {busy && <span className="animate-spin rounded-full h-4 w-4 border-2 border-on-primary border-t-transparent"></span>}
          {busy ? "Authorizing..." : "Access Terminal"}
        </button>
      </form>
    </div>
  );
}
