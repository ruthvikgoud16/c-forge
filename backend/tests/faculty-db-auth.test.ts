import { beforeEach, describe, expect, it } from "vitest";
import { GET as getOverview } from "@/app/api/v1/faculty/overview/route";
import { POST as postInvite } from "@/app/api/v1/faculty/invitations/route";
import { closeSql, FacultyPersistError, withFacultyTx } from "@/lib/academy/db";
import { resetRoster, seedRoster } from "@/lib/roster/store";
import { resetStore } from "@/lib/academy/store";
import { facultyOverviewPayload } from "@/lib/faculty/overview";
import { mintInvitation } from "@/lib/academy/onboard";

const FACULTY = "test-faculty-token-2f71";

beforeEach(async () => {
  process.env.FACULTY_TOKEN = FACULTY;
  process.env.DATABASE_URL = "postgres://cforge:unused@127.0.0.1:5432/cforge";
  delete process.env.FACULTY_DATABASE_URL;
  await closeSql();
  resetStore();
  resetRoster();
  seedRoster();
});

function facultyReq(path: string, init?: RequestInit) {
  return new Request(`http://127.0.0.1${path}`, {
    ...init,
    headers: { authorization: `Bearer ${FACULTY}`, "content-type": "application/json", ...init?.headers },
  });
}

describe("faculty database authorization 2F.7.1", () => {
  it("fails closed when the app database is set but faculty credentials are missing", async () => {
    await expect(withFacultyTx(async () => null)).rejects.toBeInstanceOf(FacultyPersistError);
    const overview = await getOverview(facultyReq("/api/v1/faculty/overview"));
    expect(overview.status).toBe(503);
    const minted = await mintInvitation("26EG104G01", 1);
    expect(minted).toMatchObject({ ok: false, status: 503, error: "FACULTY_PERSIST_FAILED" });
  });

  it("rejects student-shaped requests on faculty APIs", async () => {
    const response = await getOverview(
      new Request("http://127.0.0.1/api/v1/faculty/overview", {
        headers: { cookie: "cforge_session=forged", authorization: "Bearer student" },
      }),
    );
    expect(response.status).toBe(401);
  });

  it("still serves roster and invitations from memory when no app database is configured", async () => {
    delete process.env.DATABASE_URL;
    await closeSql();
    const payload = await facultyOverviewPayload();
    expect(payload.cohortCapacity).toBe(55);
    expect(payload.approvedRoster).toBe(55);
    const minted = await postInvite(
      facultyReq("/api/v1/faculty/invitations", {
        method: "POST",
        body: JSON.stringify({ rollNumber: "26EG104G08", ttlHours: 1 }),
      }),
    );
    expect(minted.status).toBe(201);
    const body = (await minted.json()) as { token: string; rollNumber: string };
    expect(body.rollNumber).toBe("26EG104G08");
    expect(body.token).toBeTruthy();
  });
});
