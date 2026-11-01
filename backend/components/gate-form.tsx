"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Mode = "login" | "join";

export function GateForm({ mode, initialToken = "" }: { mode: Mode; initialToken?: string }) {
  const router = useRouter();
  const [token, setToken] = useState(initialToken);
  const [rollIdentifier, setRoll] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    const url = mode === "join" ? "/api/v1/auth/invite/accept" : "/api/v1/auth/login";
    const response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(
        mode === "join" ? { token, rollIdentifier, password } : { rollIdentifier, password },
      ),
    });
    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error ?? "request failed");
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="card">
      {mode === "join" ? (
        <label>
          Invitation token
          <input value={token} onChange={(e) => setToken(e.target.value)} required />
        </label>
      ) : null}
      <label>
        Roll identifier
        <input value={rollIdentifier} onChange={(e) => setRoll(e.target.value)} required />
      </label>
      <label>
        Password
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </label>
      {error ? <p className="status-bad">{error}</p> : null}
      <button type="submit">{mode === "join" ? "Accept invitation" : "Log in"}</button>
    </form>
  );
}
