import { spawn } from "node:child_process";
import { mkdir, writeFile, rm, copyFile, chmod } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { defaultPaths, requireLinuxJailer } from "./preflight.mjs";
import { LIMITS } from "./limits.mjs";
import { logEvent } from "./log.mjs";
import { requestVsock, waitForVsockPort } from "./vsock.mjs";
import { assertGuestSafe, boundResult, compileRequest, runRequest, shutdownRequest } from "./protocol.mjs";

export function machineConfig({ kernel, rootfs, vsockPath, guestCid, memMiB = LIMITS.compileMemoryMiB }) {
  return {
    "boot-source": {
      kernel_image_path: kernel,
      boot_args: "reboot=k panic=1 pci=off nomodules quiet 8250.nr_uarts=0",
    },
    drives: [
      {
        drive_id: "rootfs",
        path_on_host: rootfs,
        is_root_device: true,
        is_read_only: true,
      },
    ],
    "machine-config": {
      vcpu_count: 1,
      mem_size_mib: memMiB,
      smt: false,
    },
    vsock: {
      guest_cid: guestCid,
      uds_path: vsockPath,
    },
  };
}

export function jailerArgs({ jailer, firecracker, identity, jailBase, cgroup }) {
  return [
    jailer,
    "--id",
    identity.vmId,
    "--exec-file",
    firecracker,
    "--uid",
    String(identity.uid),
    "--gid",
    String(identity.gid),
    "--chroot-base-dir",
    jailBase,
    "--cgroup-version",
    "2",
    "--cgroup",
    cgroup,
    "--new-pid-ns",
    "--daemonize",
    "--",
    "--no-api",
    "--config-file",
    "/vm.json",
    "--seccomp-level",
    "2",
  ];
}

export function assertNoGuestNetwork(config) {
  if (config["network-interfaces"]?.length) {
    throw new Error("guest NIC is forbidden");
  }
  const text = JSON.stringify(config);
  if (/"iface_id"|tap-|\/dev\/net\/tun/.test(text)) {
    throw new Error("guest TAP is forbidden");
  }
}

export function createFirecrackerDriver(options = {}) {
  const paths = options.paths ?? defaultPaths();
  const spawnImpl = options.spawn ?? spawn;

  async function prepareJail(identity) {
    requireLinuxJailer(paths);
    const jailRoot = join(paths.jailBase, identity.vmId, "root");
    await mkdir(jailRoot, { recursive: true });
    await copyFile(paths.kernel, join(jailRoot, "vmlinux"));
    await copyFile(paths.rootfs, join(jailRoot, "rootfs.ext4"));
    const vsockPath = "/vsock.sock";
    const config = machineConfig({
      kernel: "/vmlinux",
      rootfs: "/rootfs.ext4",
      vsockPath,
      guestCid: identity.guestCid,
    });
    assertNoGuestNetwork(config);
    await writeFile(join(jailRoot, "vm.json"), JSON.stringify(config));
    await chmod(join(jailRoot, "vm.json"), 0o400);
    return { jailRoot, hostVsock: join(jailRoot, "vsock.sock"), config };
  }

  async function startVm(identity) {
    const prepared = await prepareJail(identity);
    const args = jailerArgs({
      jailer: paths.jailer,
      firecracker: paths.firecracker,
      identity,
      jailBase: paths.jailBase,
      cgroup: `cforge-jobs/${identity.vmId}`,
    });
    if (args[0] !== paths.jailer) throw new Error("jailer_required");
    logEvent("vm_start", { vmId: identity.vmId, uid: identity.uid });
    const child = spawnImpl(args[0], args.slice(1), {
      stdio: ["ignore", "ignore", "ignore"],
      detached: true,
    });
    child.unref();
    await waitForVsockPort(prepared.hostVsock, LIMITS.vsockPort, LIMITS.bootWaitMs);
    return { ...prepared, pid: child.pid };
  }

  async function compile(session, source) {
    const payload = compileRequest(source);
    assertGuestSafe(payload);
    const reply = await requestVsock(
      `${session.hostVsock}_${LIMITS.vsockPort}`,
      payload,
      LIMITS.compileWallMs + 1_000,
    );
    return reply;
  }

  async function run(session, stdin) {
    const payload = runRequest(stdin);
    assertGuestSafe(payload);
    const reply = await requestVsock(
      `${session.hostVsock}_${LIMITS.vsockPort}`,
      payload,
      LIMITS.executeWallMs + 1_000,
    );
    return boundResult(reply);
  }

  async function destroy(identity, session) {
    try {
      if (session?.hostVsock) {
        await requestVsock(`${session.hostVsock}_${LIMITS.vsockPort}`, shutdownRequest(), 500).catch(() => undefined);
      }
    } catch {
      /* best effort */
    }
    if (identity?.vmId) {
      try {
        spawnImpl("pkill", ["-9", "-f", `jailer.*${identity.vmId}`], { stdio: "ignore" });
      } catch {
        /* already gone */
      }
      await rm(join(paths.jailBase, identity.vmId), { recursive: true, force: true });
    }
    logEvent("vm_destroy", { vmId: identity?.vmId });
  }

  return { prepareJail, startVm, compile, run, destroy, paths };
}

export function jailExists(paths, vmId) {
  return existsSync(join(paths.jailBase, vmId));
}
