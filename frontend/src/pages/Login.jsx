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
    <div className="center-screen">
      <form className="card login-card" onSubmit={handleSubmit}>
        <h1>Sign in</h1>
        <p className="subtitle">Enter the ID and password your admin gave you.</p>

        {error && <div className="error-box">{error}</div>}

        <label htmlFor="username">Username</label>
        <input
          id="username" type="text" autoComplete="username" placeholder="e.g. jsmith"
          value={username} onChange={(e) => setUsername(e.target.value)}
        />
        <label htmlFor="password">Password</label>
        <input
          id="password" type="password" autoComplete="current-password" placeholder="••••••••"
          value={password} onChange={(e) => setPassword(e.target.value)}
        />

        <div style={{ marginTop: 20 }}>
          <button className="btn" type="submit" disabled={busy}>
            {busy ? <><span className="spinner"></span> Signing in…</> : "Sign in"}
          </button>
        </div>
      </form>
    </div>
  );
}
