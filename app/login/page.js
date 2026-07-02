"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import ThemeToggle from "../../components/ThemeToggle";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        setError(j.error || "Incorrect password.");
        setBusy(false);
        return;
      }
      router.replace("/");
      router.refresh();
    } catch {
      setError("Couldn't reach the server. Try again.");
      setBusy(false);
    }
  }

  return (
    <div className="center-screen">
      <form className="login-form" onSubmit={submit}>
        <div className="gate-top">
          <div className="eyebrow">Reload · private training log</div>
          <ThemeToggle />
        </div>
        <h1>Enter your password</h1>
        <p>This device needs your app password once. There is no GitHub token to copy anywhere.</p>
        <div className="card">
          <div className="field">
            <label htmlFor="pw">Password</label>
            <input
              id="pw"
              type="password"
              autoComplete="current-password"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="row">
            <button className="btn" type="submit" disabled={busy || !password}>
              {busy ? "Checking…" : "Unlock"}
            </button>
          </div>
          {error ? <div className="err">{error}</div> : null}
        </div>
      </form>
    </div>
  );
}
