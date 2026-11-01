"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SignOutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function signOut() {
    setPending(true);
    await fetch("/api/v1/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <button className="em-btn em-btn-quiet em-btn-sm" type="button" onClick={signOut} disabled={pending}>
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}
