import { describe, expect, it } from "vitest";
import { inspectHost } from "../services/judge-firecracker/src/preflight.mjs";

const host = inspectHost();
const live = Boolean(process.env.CFORGE_FC_LIVE === "1" && host.ready && process.env.JUDGE_URL && process.env.JUDGE_SECRET);

async function jobApi(path: string, init?: RequestInit) {
  const response = await fetch(`${process.env.JUDGE_URL!.replace(/\/$/, "")}${path}`, {
    ...init,
    headers: {
      authorization: `Bearer ${process.env.JUDGE_SECRET}`,
      "content-type": "application/json",
      ...init?.headers,
    },
  });
  return { status: response.status, body: (await response.json()) as Record<string, unknown> };
}

describe("Firecracker I1–I12 host status", () => {
  it("does not treat this session as microVM verification", () => {
    expect(host.bootVerified).toBe(false);
    if (!host.ready) {
      expect(live).toBe(false);
      expect(host.reason).not.toBe("linux_host_assets_present");
    }
  });
});

describe.skipIf(!live)("Firecracker I1–I12 on a real KVM host", () => {
  async function readyJob(source: string, ownerId = "iso-a") {
    const created = await jobApi("/v1/jobs", {
      method: "POST",
      body: JSON.stringify({ source, language: "c11", ownerId }),
    });
    return created;
  }

  it("I1 denies host filesystem paths from the guest", async () => {
    const created = await readyJob(`#include <stdio.h>
int main(void){
  FILE *f = fopen("/etc/cforge/judge-firecracker.env","r");
  FILE *p = fopen("/proc/1/environ","r");
  if(f||p){ puts("leaked"); return 0; }
  puts("denied");
  return 0;
}
`);
    expect(created.body.status).toBe("ready");
    const ran = await jobApi(`/v1/jobs/${created.body.jobId}/run`, {
      method: "POST",
      body: JSON.stringify({ ownerId: "iso-a", stdin: "" }),
    });
    expect(ran.body.stdout).toBe("denied\n");
    await jobApi(`/v1/jobs/${created.body.jobId}`, { method: "DELETE", body: JSON.stringify({ ownerId: "iso-a" }) });
  });

  it("I2 has no guest network", async () => {
    const created = await readyJob(`#include <stdio.h>
int socket(int,int,int);
int main(void){ int fd = socket(2,1,0); puts(fd<0?"net_denied":"net_open"); return 0; }
`);
    expect(created.body.status).toBe("ready");
    const ran = await jobApi(`/v1/jobs/${created.body.jobId}/run`, {
      method: "POST",
      body: JSON.stringify({ ownerId: "iso-a", stdin: "" }),
    });
    expect(String(ran.body.stdout)).toMatch(/net_denied/);
    await jobApi(`/v1/jobs/${created.body.jobId}`, { method: "DELETE", body: JSON.stringify({ ownerId: "iso-a" }) });
  });

  it("I3 isolates two jobs", async () => {
    const a = await readyJob("#include <stdio.h>\nint main(void){puts(\"A\");return 0;}\n", "iso-a");
    const b = await readyJob("#include <stdio.h>\nint main(void){puts(\"B\");return 0;}\n", "iso-b");
    const ar = await jobApi(`/v1/jobs/${a.body.jobId}/run`, { method: "POST", body: JSON.stringify({ ownerId: "iso-a", stdin: "" }) });
    const br = await jobApi(`/v1/jobs/${b.body.jobId}/run`, { method: "POST", body: JSON.stringify({ ownerId: "iso-b", stdin: "" }) });
    expect(ar.body.stdout).toBe("A\n");
    expect(br.body.stdout).toBe("B\n");
    const cross = await jobApi(`/v1/jobs/${a.body.jobId}/run`, { method: "POST", body: JSON.stringify({ ownerId: "iso-b", stdin: "" }) });
    expect(cross.body.status).toBe("forbidden");
    await jobApi(`/v1/jobs/${a.body.jobId}`, { method: "DELETE", body: JSON.stringify({ ownerId: "iso-a" }) });
    await jobApi(`/v1/jobs/${b.body.jobId}`, { method: "DELETE", body: JSON.stringify({ ownerId: "iso-b" }) });
  });

  it("I4 stops process exhaustion", async () => {
    const created = await readyJob(`#include <unistd.h>\nint main(void){for(;;)fork();}\n`);
    expect(["ready", "compile_error"]).toContain(created.body.status);
    if (created.body.status === "ready") {
      const ran = await jobApi(`/v1/jobs/${created.body.jobId}/run`, { method: "POST", body: JSON.stringify({ ownerId: "iso-a", stdin: "" }) });
      expect(["runtime_error", "timeout"]).toContain(ran.body.status);
      await jobApi(`/v1/jobs/${created.body.jobId}`, { method: "DELETE", body: JSON.stringify({ ownerId: "iso-a" }) });
    }
  });

  it("I5 stops memory exhaustion", async () => {
    const created = await readyJob(`#include <stdlib.h>\n#include <string.h>\nint main(void){for(;;){char *p=malloc(16*1024*1024);if(!p)return 2;memset(p,1,16*1024*1024);}}\n`);
    expect(created.body.status).toBe("ready");
    const ran = await jobApi(`/v1/jobs/${created.body.jobId}/run`, { method: "POST", body: JSON.stringify({ ownerId: "iso-a", stdin: "" }) });
    expect(["runtime_error", "timeout"]).toContain(ran.body.status);
    await jobApi(`/v1/jobs/${created.body.jobId}`, { method: "DELETE", body: JSON.stringify({ ownerId: "iso-a" }) });
  });

  it("I6 caps flooded output", async () => {
    const created = await readyJob(`#include <stdio.h>\nint main(void){for(;;) putchar('x');}\n`);
    expect(created.body.status).toBe("ready");
    const ran = await jobApi(`/v1/jobs/${created.body.jobId}/run`, { method: "POST", body: JSON.stringify({ ownerId: "iso-a", stdin: "" }) });
    expect(String(ran.body.stdout).length).toBeLessThanOrEqual(65536);
    await jobApi(`/v1/jobs/${created.body.jobId}`, { method: "DELETE", body: JSON.stringify({ ownerId: "iso-a" }) });
  });

  it("I7 kills an infinite loop", async () => {
    const created = await readyJob("int main(void){for(;;){}}\n");
    expect(created.body.status).toBe("ready");
    const started = Date.now();
    const ran = await jobApi(`/v1/jobs/${created.body.jobId}/run`, { method: "POST", body: JSON.stringify({ ownerId: "iso-a", stdin: "" }) });
    expect(ran.body.status).toBe("timeout");
    expect(Date.now() - started).toBeLessThan(8000);
    await jobApi(`/v1/jobs/${created.body.jobId}`, { method: "DELETE", body: JSON.stringify({ ownerId: "iso-a" }) });
  });

  it("I8 recovers after a compiler crash/error", async () => {
    const bad = await readyJob("not c source");
    expect(bad.body.status).toBe("compile_error");
    const good = await readyJob("#include <stdio.h>\nint main(void){puts(\"ok\");return 0;}\n");
    expect(good.body.status).toBe("ready");
    await jobApi(`/v1/jobs/${good.body.jobId}`, { method: "DELETE", body: JSON.stringify({ ownerId: "iso-a" }) });
  });

  it("I9 rejects a saturated queue", async () => {
    const jobs = await Promise.all(
      Array.from({ length: 5 }, (_, i) => readyJob("int main(void){for(;;){}}\n", `q${i}`)),
    );
    expect(jobs.some((row) => row.body.status === "queue_full" || row.status === 429)).toBe(true);
    for (const row of jobs) {
      if (row.body.jobId) {
        await jobApi(`/v1/jobs/${row.body.jobId}`, { method: "DELETE", body: JSON.stringify({ ownerId: row.body.ownerId ?? "iso-a" }) });
      }
    }
  });

  it("I10 keeps judge secrets out of the guest", async () => {
    const created = await readyJob(`#include <stdio.h>\n#include <stdlib.h>\nint main(void){puts(getenv("JUDGE_SECRET")?"secret":"empty");return 0;}\n`);
    expect(created.body.status).toBe("ready");
    const ran = await jobApi(`/v1/jobs/${created.body.jobId}/run`, { method: "POST", body: JSON.stringify({ ownerId: "iso-a", stdin: "" }) });
    expect(ran.body.stdout).toBe("empty\n");
    expect(JSON.stringify(ran.body)).not.toContain(process.env.JUDGE_SECRET);
    await jobApi(`/v1/jobs/${created.body.jobId}`, { method: "DELETE", body: JSON.stringify({ ownerId: "iso-a" }) });
  });

  it("I11 destroys the VM after failure", async () => {
    const created = await readyJob("int main(void){for(;;){}}\n");
    expect(created.body.status).toBe("ready");
    await jobApi(`/v1/jobs/${created.body.jobId}/run`, { method: "POST", body: JSON.stringify({ ownerId: "iso-a", stdin: "" }) });
    const destroyed = await jobApi(`/v1/jobs/${created.body.jobId}`, { method: "DELETE", body: JSON.stringify({ ownerId: "iso-a" }) });
    expect(destroyed.body.status).toBe("destroyed");
    const again = await jobApi(`/v1/jobs/${created.body.jobId}/run`, { method: "POST", body: JSON.stringify({ ownerId: "iso-a", stdin: "" }) });
    expect(again.body.status).toBe("not_found");
  });

  it("I12 compiles once then runs two tests", async () => {
    const created = await readyJob("#include <stdio.h>\nint main(void){int x; scanf(\"%d\",&x); printf(\"%d\\n\",x); return 0;}\n");
    expect(created.body.status).toBe("ready");
    const a = await jobApi(`/v1/jobs/${created.body.jobId}/run`, { method: "POST", body: JSON.stringify({ ownerId: "iso-a", stdin: "1\n" }) });
    const b = await jobApi(`/v1/jobs/${created.body.jobId}/run`, { method: "POST", body: JSON.stringify({ ownerId: "iso-a", stdin: "2\n" }) });
    expect(a.body.stdout).toBe("1\n");
    expect(b.body.stdout).toBe("2\n");
    await jobApi(`/v1/jobs/${created.body.jobId}`, { method: "DELETE", body: JSON.stringify({ ownerId: "iso-a" }) });
  });
});
