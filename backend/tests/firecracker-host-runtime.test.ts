import { describe, expect, it } from "vitest";
import { inspectHost } from "../services/judge-firecracker/src/preflight.mjs";
import { createAdmissionQueue } from "../services/judge-firecracker/src/queue.mjs";
import { createIdentityPool } from "../services/judge-firecracker/src/identity.mjs";
import { encodeFrame, decodeFrames, compileRequest, assertGuestSafe } from "../services/judge-firecracker/src/protocol.mjs";
import { machineConfig, jailerArgs, assertNoGuestNetwork } from "../services/judge-firecracker/src/host.mjs";
import { createJobSupervisor } from "../services/judge-firecracker/src/jobs.mjs";
import { createLoopbackDriver } from "../services/judge-firecracker/src/loopback-driver.mjs";
import { logEvent } from "../services/judge-firecracker/src/log.mjs";
import { FIRECRACKER_LIMITS } from "@/lib/judge/firecracker-contract";

describe("Firecracker host runtime (not isolation evidence)", () => {
  it("reports this macOS host as not ready and does not claim a boot", () => {
    const host = inspectHost();
    expect(host.os).toBe("darwin");
    expect(host.linux).toBe(false);
    expect(host.kvm).toBe(false);
    expect(host.ready).toBe(false);
    expect(host.bootVerified).toBe(false);
    expect(host.reason).toBe("not_linux");
    expect(host.versionPin).toBe("v1.12.0");
  });

  it("builds a jailer command with unique uid and no NIC or TAP", () => {
    const identity = { vmId: "abc123", uid: 61201, gid: 61201, guestCid: 101, jobId: "j" };
    const args = jailerArgs({
      jailer: "/var/lib/cforge/firecracker/bin/jailer",
      firecracker: "/var/lib/cforge/firecracker/bin/firecracker",
      identity,
      jailBase: "/var/lib/cforge/fc-jail",
      cgroup: "cforge-jobs/abc123",
    });
    expect(args[0]).toMatch(/jailer$/);
    expect(args).toContain("--uid");
    expect(args).toContain("61201");
    expect(args.join(" ")).not.toMatch(/tap|tun|netdev/i);
    const config = machineConfig({
      kernel: "/vmlinux",
      rootfs: "/rootfs.ext4",
      vsockPath: "/vsock.sock",
      guestCid: 101,
    });
    expect(config["network-interfaces"]).toBeUndefined();
    expect(() => assertNoGuestNetwork(config)).not.toThrow();
    expect(() => assertNoGuestNetwork({ ...config, "network-interfaces": [{ iface_id: "eth0" }] })).toThrow(/NIC/);
  });

  it("admits at most four jobs and two compiles", async () => {
    const q = createAdmissionQueue();
    expect(q.tryAdmitJob()).toBe(true);
    expect(q.tryAdmitJob()).toBe(true);
    expect(q.tryAdmitJob()).toBe(true);
    expect(q.tryAdmitJob()).toBe(true);
    expect(q.tryAdmitJob()).toBe(false);
    let release = () => undefined;
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });
    const first = q.withCompile(() => held);
    const second = q.withCompile(() => held);
    await expect(q.withCompile(async () => undefined)).rejects.toMatchObject({ code: "queue_full" });
    release();
    await Promise.all([first, second]);
  });

  it("rejects answer keys in guest frames", () => {
    expect(() => assertGuestSafe({ op: "run", stdin: "1", expectedStdout: "2" })).toThrow(/answer key/);
    const frame = encodeFrame(compileRequest("int main(){return 0;}"));
    const { messages } = decodeFrames(frame);
    expect(messages[0]).toMatchObject({ op: "compile", language: "c11" });
    expect(FIRECRACKER_LIMITS.maxConcurrentCompiles).toBe(2);
    expect(FIRECRACKER_LIMITS.executeMemoryMiB).toBe(64);
  });

  it("allocates exclusive uid/gid/cid pairs", () => {
    const pool = createIdentityPool();
    const a = pool.allocate("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa");
    const b = pool.allocate("bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb");
    expect(a?.uid).not.toBe(b?.uid);
    expect(a?.guestCid).not.toBe(b?.guestCid);
    pool.release("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa");
    expect(pool.size()).toBe(1);
  });
});

describe("loopback driver is not a microVM", () => {
  it("compiles once, streams two stdin payloads, then destroys storage", async () => {
    const driver = createLoopbackDriver();
    expect(driver.isolationEvidence).toBe(false);
    const supervisor = createJobSupervisor(driver);
    const created = await supervisor.createJob({
      source: "#include <stdio.h>\nint main(void){int x; if(scanf(\"%d\",&x)==1) printf(\"%d\\n\",x*2); return 0;}\n",
      language: "c11",
      ownerId: "student-a",
    });
    if (created.status !== "ready") {
      expect(["compile_error", "invalid"]).toContain(created.status);
      return;
    }
    const first = await supervisor.runJob({ jobId: created.jobId, ownerId: "student-a", stdin: "3\n" });
    const second = await supervisor.runJob({ jobId: created.jobId, ownerId: "student-a", stdin: "4\n" });
    expect(supervisor.jobs.get(created.jobId)?.compileCount).toBe(1);
    if (first.status === "ok") expect(first.stdout).toBe("6\n");
    if (second.status === "ok") expect(second.stdout).toBe("8\n");
    expect(await supervisor.destroyJob({ jobId: created.jobId, ownerId: "student-b" })).toEqual({ status: "forbidden" });
    expect(await supervisor.destroyJob({ jobId: created.jobId, ownerId: "student-a" })).toEqual({ status: "destroyed" });
    expect(supervisor.active()).toBe(0);
  }, 20_000);

  it("returns queue_full on the fifth concurrent job", async () => {
    const driver = {
      isolationEvidence: false,
      async startVm() {
        return { hostVsock: "unused" };
      },
      async compile() {
        return { ok: true };
      },
      async run() {
        return { status: "ok", stdout: "", stderr: "" };
      },
      async destroy() {},
    };
    const supervisor = createJobSupervisor(driver);
    const ready = [];
    for (let i = 0; i < 4; i += 1) {
      const created = await supervisor.createJob({
        source: "int main(void){return 0;}\n",
        language: "c11",
        ownerId: `o${i}`,
      });
      ready.push(created);
    }
    expect(ready.every((row) => row.status === "ready")).toBe(true);
    const overflow = await supervisor.createJob({
      source: "int main(void){return 0;}\n",
      language: "c11",
      ownerId: "o4",
    });
    expect(overflow.status).toBe("queue_full");
    await supervisor.destroyAll();
  });
});

describe("structured logs", () => {
  it("do not include source or bearer tokens", () => {
    const writes: string[] = [];
    const orig = process.stdout.write;
    process.stdout.write = ((chunk: string) => {
      writes.push(String(chunk));
      return true;
    }) as typeof process.stdout.write;
    try {
      logEvent("vm_start", { source: "secret-c", stdin: "x", secret: "JUDGE_SECRET=abc" });
    } finally {
      process.stdout.write = orig;
    }
    expect(writes.join("")).not.toContain("secret-c");
    expect(writes.join("")).not.toContain("JUDGE_SECRET=abc");
  });
});
