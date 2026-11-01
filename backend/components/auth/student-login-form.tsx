"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const MESSAGES: Record<string, string> = {
  unauthorized: "Roll number or password is incorrect.",
  missing_fields: "Roll number and password are required.",
  weak_password: "Password must be at least 10 characters.",
  rate_limited: "Too many attempts. Wait a moment and try again.",
};

export function StudentLoginForm() {
  const router = useRouter();
  const [roll, setRoll] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!roll.trim()) {
      setError("Roll number is required.");
      return;
    }
    if (password.length < 10) {
      setError("Password must be at least 10 characters.");
      return;
    }
    setLoading(true);
    setError("");
    const response = await fetch("/api/v1/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ rollIdentifier: roll, password }),
    });
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    if (!response.ok) {
      setLoading(false);
      setError(MESSAGES[payload?.error ?? ""] ?? "Sign-in failed.");
      return;
    }
    router.push("/learn");
    router.refresh();
  }

  return (
    <form className="em-form" onSubmit={onSubmit} noValidate>
      {error ? (
        <p className="em-alert" role="alert">
          {error}
        </p>
      ) : null}
      <div className="em-field">
        <label htmlFor="roll">Roll number</label>
        <input
          id="roll"
          name="rollIdentifier"
          autoComplete="username"
          value={roll}
          onChange={(event) => setRoll(event.target.value)}
          required
        />
      </div>
      <div className="em-field">
        <label htmlFor="pw">Password</label>
        <span className="em-pw">
          <input
            id="pw"
            name="password"
            type={show ? "text" : "password"}
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          <button type="button" onClick={() => setShow((value) => !value)} aria-label={show ? "Hide password" : "Show password"}>
            {show ? "Hide" : "Show"}
          </button>
        </span>
      </div>
      <button className="em-btn em-btn-hero" type="submit" disabled={loading}>
        {loading ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
