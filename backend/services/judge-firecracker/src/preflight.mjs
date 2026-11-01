import { existsSync, readFileSync, statSync } from "node:fs";
import { platform, arch } from "node:os";
import { join } from "node:path";

export function defaultPaths() {
  const root = process.env.CFORGE_FC_ROOT || "/var/lib/cforge/firecracker";
  return {
    root,
    firecracker: process.env.CFORGE_FC_BIN || join(root, "bin/firecracker"),
    jailer: process.env.CFORGE_JAILER_BIN || join(root, "bin/jailer"),
    kernel: process.env.CFORGE_FC_KERNEL || join(root, "images/vmlinux"),
    rootfs: process.env.CFORGE_FC_ROOTFS || join(root, "images/rootfs.ext4"),
    jailBase: process.env.CFORGE_FC_JAIL || "/var/lib/cforge/fc-jail",
    runDir: process.env.CFORGE_FC_RUN || "/run/cforge-fc",
  };
}

function readable(path) {
  try {
    return existsSync(path) && statSync(path).isFile();
  } catch {
    return false;
  }
}

function kvmOk() {
  try {
    const st = statSync("/dev/kvm");
    return Boolean(st);
  } catch {
    return false;
  }
}

function cgroupV2() {
  try {
    return existsSync("/sys/fs/cgroup/cgroup.controllers");
  } catch {
    return false;
  }
}

export function inspectHost(paths = defaultPaths()) {
  const os = platform();
  const cpu = arch();
  const linux = os === "linux";
  const kvm = linux && kvmOk();
  const cgroup = linux && cgroupV2();
  const firecracker = readable(paths.firecracker);
  const jailer = readable(paths.jailer);
  const kernel = readable(paths.kernel);
  const rootfs = readable(paths.rootfs);
  const ready = linux && kvm && cgroup && firecracker && jailer && kernel && rootfs;
  return {
    os,
    arch: cpu,
    linux,
    kvm,
    cgroupV2: cgroup,
    firecracker,
    jailer,
    kernel,
    rootfs,
    ready,
    bootVerified: false,
    reason: ready
      ? "linux_host_assets_present"
      : os !== "linux"
        ? "not_linux"
        : !kvm
          ? "kvm_unavailable"
          : !cgroup
            ? "cgroup_v2_unavailable"
            : !firecracker || !jailer
              ? "firecracker_or_jailer_missing"
              : "guest_images_missing",
    versionPin: "v1.12.0",
    paths,
  };
}

export function requireLinuxJailer(paths = defaultPaths()) {
  const info = inspectHost(paths);
  if (!info.ready) {
    const error = new Error(`firecracker_host_unavailable:${info.reason}`);
    error.code = "FIRECRACKER_HOST_UNAVAILABLE";
    throw error;
  }
  if (!paths.jailer.endsWith("jailer") && !readFileSync(paths.jailer).length) {
    throw new Error("jailer_required");
  }
  return info;
}
