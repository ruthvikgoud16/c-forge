import { sha256 } from "@/lib/academy/crypto";
import { json } from "@/lib/academy/http";
import { getStore } from "@/lib/academy/store";

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token")?.trim() ?? "";
  if (!token) return json(400, { error: "not-found" });
  const row = getStore().invitations.get(sha256(token));
  if (!row) return json(404, { error: "not-found" });
  const status = row.revokedAt ? "revoked" : row.consumedBy ? "accepted" : row.expiresAt < Date.now() ? "expired" : "pending";
  return json(200, {
    invitation: {
      id: sha256(token).slice(0, 12),
      rollNumber: row.rollNumber,
      status,
      createdAt: "",
      expiresAt: new Date(row.expiresAt).toISOString().slice(0, 10),
    },
  });
}
