import { beforeEach, describe, expect, it } from "vitest";
import { GET as getInvites, POST as postInvite } from "@/app/api/v1/faculty/invitations/route";
import { acceptInvite, mintInvitation, revokeInvitation } from "@/lib/academy/onboard";
import { closeSql } from "@/lib/academy/db";
import { getStore, resetStore, SEAT_CAP } from "@/lib/academy/store";
import { sha256 } from "@/lib/academy/crypto";
import { resetRoster, seedRoster } from "@/lib/roster/store";
import { officialRollNumbers } from "@/lib/roster/rolls";

const FACULTY = "test-faculty-token-2f51";

beforeEach(async () => {
  process.env.FACULTY_TOKEN = FACULTY;
  delete process.env.DATABASE_URL;
  delete process.env.ALLOW_DEV_INVITE;
  await closeSql();
  resetStore();
  resetRoster();
  seedRoster();
});

function facultyReq(init?: RequestInit) {
  return new Request("http://127.0.0.1/api/v1/faculty/invitations", {
    ...init,
    headers: { authorization: `Bearer ${FACULTY}`, "content-type": "application/json", ...init?.headers },
  });
}

describe("roll-bound invitations 2F.5.1", () => {
  it("mints and accepts a valid invitation for an approved unregistered roll", async () => {
    const minted = await mintInvitation("26eg104g01", 1);
    expect(minted.ok).toBe(true);
    if (!minted.ok) return;
    expect(minted.rollNumber).toBe("26EG104G01");
    const accepted = await acceptInvite({
      token: minted.token,
      rollIdentifier: "26EG104G01",
      password: "password1234",
    });
    expect(accepted.ok).toBe(true);
    if (!accepted.ok) return;
    expect(accepted.student.rollIdentifier).toBe("26EG104G01");
    expect(accepted.student.passwordHash).toBeTruthy();
  });

  it("rejects accept with a different official roll", async () => {
    const minted = await mintInvitation("26EG104G01", 1);
    expect(minted.ok).toBe(true);
    if (!minted.ok) return;
    const accepted = await acceptInvite({
      token: minted.token,
      rollIdentifier: "26EG104G02",
      password: "password1234",
    });
    expect(accepted).toMatchObject({ ok: false, error: "roll_mismatch" });
    expect(getStore().students.size).toBe(0);
  });

  it("rejects a second active invitation for the same roll", async () => {
    const first = await mintInvitation("26EG104G03", 24);
    expect(first.ok).toBe(true);
    const second = await mintInvitation("26EG104G03", 24);
    expect(second).toMatchObject({ ok: false, status: 409, error: "duplicate_invitation" });
  });

  it("rejects an expired invitation", async () => {
    getStore().addInvitation(sha256("expired-token"), -1000, "26EG104G04");
    const accepted = await acceptInvite({
      token: "expired-token",
      rollIdentifier: "26EG104G04",
      password: "password1234",
    });
    expect(accepted).toMatchObject({ ok: false, error: "invalid_invitation" });
    expect(getStore().students.size).toBe(0);
  });

  it("rejects a revoked invitation", async () => {
    const minted = await mintInvitation("26EG104G05", 24);
    expect(minted.ok).toBe(true);
    if (!minted.ok) return;
    const revoked = await revokeInvitation("26EG104G05");
    expect(revoked.ok).toBe(true);
    const accepted = await acceptInvite({
      token: minted.token,
      rollIdentifier: "26EG104G05",
      password: "password1234",
    });
    expect(accepted).toMatchObject({ ok: false, error: "revoked_invitation" });
  });

  it("rejects a second acceptance of the same invitation", async () => {
    const minted = await mintInvitation("26EG104G06", 24);
    expect(minted.ok).toBe(true);
    if (!minted.ok) return;
    const first = await acceptInvite({
      token: minted.token,
      rollIdentifier: "26EG104G06",
      password: "password1234",
    });
    expect(first.ok).toBe(true);
    const second = await acceptInvite({
      token: minted.token,
      rollIdentifier: "26EG104G06",
      password: "password1234",
    });
    expect(second).toMatchObject({ ok: false, error: "already_registered" });
    expect(getStore().students.size).toBe(1);
  });

  it("rejects unauthorized faculty mint and list", async () => {
    const anon = await postInvite(new Request("http://127.0.0.1/api/v1/faculty/invitations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ rollNumber: "26EG104G01", ttlHours: 1 }),
    }));
    expect(anon.status).toBe(401);
    const student = await getInvites(new Request("http://127.0.0.1/api/v1/faculty/invitations", {
      headers: { authorization: "Bearer student-token" },
    }));
    expect(student.status).toBe(401);
  });

  it("rejects a 56th roster roll on mint and accept", async () => {
    const minted = await mintInvitation("26EG104G56", 1);
    expect(minted).toMatchObject({ ok: false, error: "unknown_roll" });
    const accepted = await acceptInvite({
      token: "any-token",
      rollIdentifier: "26EG104G56",
      password: "password1234",
    });
    expect(accepted).toMatchObject({ ok: false, error: "unknown_roll" });
    expect(officialRollNumbers()).toHaveLength(55);
    expect(SEAT_CAP).toBe(55);
  });

  it("lists invitations without raw tokens and requires a roll to mint", async () => {
    const missing = await postInvite(facultyReq({
      method: "POST",
      body: JSON.stringify({ ttlHours: 1 }),
    }));
    expect(missing.status).toBe(400);
    const minted = await postInvite(facultyReq({
      method: "POST",
      body: JSON.stringify({ ttlHours: 1, rollNumber: "26EG104G07" }),
    }));
    expect(minted.status).toBe(201);
    const body = (await minted.json()) as { token: string; rollNumber: string };
    const listed = await getInvites(facultyReq());
    const list = (await listed.json()) as { pending: number; invitations: Array<{ rollNumber: string }> };
    expect(list.pending).toBe(1);
    expect(list.invitations[0]?.rollNumber).toBe("26EG104G07");
    expect(JSON.stringify(list)).not.toContain(body.token);
    expect(JSON.stringify(list)).not.toContain("token_hash");
  });
});
