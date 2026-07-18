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
    <div className="center-screen">
      <form className="card login-card" onSubmit={handleSubmit}>
        <h1>Set your password</h1>
        <p className="subtitle">
          {user ? `Welcome, ${user.name.split(" ")[0]}. ` : ""}
          This is your first sign-in. Choose a new password to continue.
        </p>

        {error && <div className="error-box">{error}</div>}

        <label htmlFor="pw1">New password</label>
        <input id="pw1" type="password" placeholder="At least 6 characters" value={pw1} onChange={(e) => setPw1(e.target.value)} />
        <label htmlFor="pw2">Confirm password</label>
        <input id="pw2" type="password" placeholder="Re-enter password" value={pw2} onChange={(e) => setPw2(e.target.value)} />

        <div style={{ marginTop: 20 }}>
          <button className="btn" type="submit" disabled={busy}>
            {busy ? "Saving…" : "Save & continue"}
          </button>
        </div>
      </form>
    </div>
  );
}
