const UID_BASE = 61200;
const POOL = 32;

export function createIdentityPool() {
  const free = Array.from({ length: POOL }, (_, i) => UID_BASE + i);
  const used = new Map();

  return {
    allocate(jobId) {
      const uid = free.pop();
      if (uid == null) return null;
      const identity = {
        jobId,
        vmId: jobId.replace(/-/g, "").slice(0, 16),
        uid,
        gid: uid,
        guestCid: 100 + (uid - UID_BASE),
      };
      used.set(jobId, identity);
      return identity;
    },
    release(jobId) {
      const identity = used.get(jobId);
      if (!identity) return;
      used.delete(jobId);
      free.push(identity.uid);
    },
    get(jobId) {
      return used.get(jobId);
    },
    size() {
      return used.size;
    },
  };
}
