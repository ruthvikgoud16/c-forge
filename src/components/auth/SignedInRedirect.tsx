import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { signedInDest } from "@/lib/session-dest";
import { services } from "@/services";

export function SignedInRedirect() {
  const nav = useNavigate();
  useEffect(() => {
    const dest = signedInDest(services.auth.currentSession()?.role);
    if (dest) nav({ to: dest });
  }, [nav]);
  return null;
}
