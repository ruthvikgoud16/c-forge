#define _GNU_SOURCE
#include <errno.h>
#include <fcntl.h>
#include <linux/landlock.h>
#include <seccomp.h>
#include <signal.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/prctl.h>
#include <sys/resource.h>
#include <sys/syscall.h>
#include <unistd.h>

#ifndef LANDLOCK_ACCESS_FS_REFER
#define LANDLOCK_ACCESS_FS_REFER (1ULL << 13)
#endif
#ifndef LANDLOCK_ACCESS_FS_TRUNCATE
#define LANDLOCK_ACCESS_FS_TRUNCATE (1ULL << 14)
#endif
#ifndef LANDLOCK_ACCESS_FS_IOCTL_DEV
#define LANDLOCK_ACCESS_FS_IOCTL_DEV (1ULL << 15)
#endif
static void die(const char *msg) {
  fprintf(stderr, "confine: %s\n", msg);
  _exit(125);
}

static void set_limit(int resource, rlim_t value) {
  struct rlimit lim = { .rlim_cur = value, .rlim_max = value };
  if (setrlimit(resource, &lim) != 0) die("setrlimit");
}

static int landlock_create(uint64_t fs) {
  struct landlock_ruleset_attr attr;
  memset(&attr, 0, sizeof(attr));
  attr.handled_access_fs = fs;
  return (int)syscall(__NR_landlock_create_ruleset, &attr, sizeof(attr), 0);
}

static void apply_landlock(const char *workspace) {
  long abi = syscall(__NR_landlock_create_ruleset, NULL, 0, LANDLOCK_CREATE_RULESET_VERSION);
  if (abi < 1) die("landlock unavailable");

  uint64_t handled_fs =
      LANDLOCK_ACCESS_FS_EXECUTE | LANDLOCK_ACCESS_FS_WRITE_FILE | LANDLOCK_ACCESS_FS_READ_FILE |
      LANDLOCK_ACCESS_FS_READ_DIR | LANDLOCK_ACCESS_FS_REMOVE_DIR | LANDLOCK_ACCESS_FS_REMOVE_FILE |
      LANDLOCK_ACCESS_FS_MAKE_CHAR | LANDLOCK_ACCESS_FS_MAKE_DIR | LANDLOCK_ACCESS_FS_MAKE_REG |
      LANDLOCK_ACCESS_FS_MAKE_SOCK | LANDLOCK_ACCESS_FS_MAKE_FIFO | LANDLOCK_ACCESS_FS_MAKE_BLOCK |
      LANDLOCK_ACCESS_FS_MAKE_SYM;
  if (abi >= 2) handled_fs |= LANDLOCK_ACCESS_FS_REFER;
  if (abi >= 3) handled_fs |= LANDLOCK_ACCESS_FS_TRUNCATE;
  if (abi >= 5) handled_fs |= LANDLOCK_ACCESS_FS_IOCTL_DEV;

  int ruleset = landlock_create(handled_fs);
  if (ruleset < 0) die("landlock_create_ruleset");

  int dirfd = open(workspace, O_PATH | O_CLOEXEC | O_DIRECTORY);
  if (dirfd < 0) die("open workspace");

  uint64_t allowed =
      LANDLOCK_ACCESS_FS_EXECUTE | LANDLOCK_ACCESS_FS_WRITE_FILE | LANDLOCK_ACCESS_FS_READ_FILE |
      LANDLOCK_ACCESS_FS_READ_DIR | LANDLOCK_ACCESS_FS_REMOVE_FILE | LANDLOCK_ACCESS_FS_MAKE_REG;
  if (abi >= 3) allowed |= LANDLOCK_ACCESS_FS_TRUNCATE;

  struct landlock_path_beneath_attr beneath;
  memset(&beneath, 0, sizeof(beneath));
  beneath.allowed_access = allowed;
  beneath.parent_fd = dirfd;
  if (syscall(__NR_landlock_add_rule, ruleset, LANDLOCK_RULE_PATH_BENEATH, &beneath, 0) != 0) {
    die("landlock_add_rule");
  }
  close(dirfd);

  if (syscall(__NR_landlock_restrict_self, ruleset, 0) != 0) die("landlock_restrict_self");
  close(ruleset);
}

static void apply_seccomp(void) {
  scmp_filter_ctx ctx = seccomp_init(SCMP_ACT_ALLOW);
  if (!ctx) die("seccomp_init");

  const int denied[] = {
      SCMP_SYS(socket),
      SCMP_SYS(socketpair),
      SCMP_SYS(connect),
      SCMP_SYS(bind),
      SCMP_SYS(listen),
      SCMP_SYS(accept),
      SCMP_SYS(accept4),
      SCMP_SYS(sendto),
      SCMP_SYS(sendmsg),
      SCMP_SYS(recvfrom),
      SCMP_SYS(recvmsg),
      SCMP_SYS(ptrace),
      SCMP_SYS(process_vm_readv),
      SCMP_SYS(process_vm_writev),
      SCMP_SYS(kcmp),
      SCMP_SYS(bpf),
      SCMP_SYS(perf_event_open),
      SCMP_SYS(clone),
      SCMP_SYS(clone3),
      SCMP_SYS(fork),
      SCMP_SYS(vfork),
      SCMP_SYS(unshare),
      SCMP_SYS(setns),
      SCMP_SYS(mount),
      SCMP_SYS(umount2),
      SCMP_SYS(pivot_root),
      SCMP_SYS(swapon),
      SCMP_SYS(swapoff),
      SCMP_SYS(reboot),
      SCMP_SYS(init_module),
      SCMP_SYS(finit_module),
      SCMP_SYS(delete_module),
  };
  for (size_t i = 0; i < sizeof(denied) / sizeof(denied[0]); i++) {
    if (seccomp_rule_add(ctx, SCMP_ACT_ERRNO(EPERM), denied[i], 0) != 0) die("seccomp_rule_add");
  }
  if (seccomp_load(ctx) != 0) die("seccomp_load");
  seccomp_release(ctx);
}

static void usage(void) {
  die("usage: confine --workspace DIR --as-mb N --cpu-sec N --fsize-mb N -- -- program");
}

int main(int argc, char **argv) {
  const char *workspace = NULL;
  rlim_t as_mb = 64;
  rlim_t cpu_sec = 2;
  rlim_t fsize_mb = 4;
  char **program = NULL;

  for (int i = 1; i < argc; i++) {
    if (strcmp(argv[i], "--") == 0) {
      program = &argv[i + 1];
      break;
    }
    if (strcmp(argv[i], "--workspace") == 0 && i + 1 < argc) workspace = argv[++i];
    else if (strcmp(argv[i], "--as-mb") == 0 && i + 1 < argc) as_mb = (rlim_t)atoi(argv[++i]);
    else if (strcmp(argv[i], "--cpu-sec") == 0 && i + 1 < argc) cpu_sec = (rlim_t)atoi(argv[++i]);
    else if (strcmp(argv[i], "--fsize-mb") == 0 && i + 1 < argc) fsize_mb = (rlim_t)atoi(argv[++i]);
    else usage();
  }
  if (!workspace || !program || !program[0]) usage();
  if (as_mb < 8 || as_mb > 256 || cpu_sec < 1 || cpu_sec > 8 || fsize_mb < 1 || fsize_mb > 16) {
    die("limit out of range");
  }
  if (chdir(workspace) != 0) die("chdir");

  set_limit(RLIMIT_AS, as_mb * 1024 * 1024);
  set_limit(RLIMIT_CPU, cpu_sec);
  set_limit(RLIMIT_FSIZE, fsize_mb * 1024 * 1024);
  set_limit(RLIMIT_CORE, 0);
  set_limit(RLIMIT_NOFILE, 8);

  if (prctl(PR_SET_PDEATHSIG, SIGKILL) != 0) die("pdeathsig");
  if (setpgid(0, 0) != 0 && errno != EPERM) die("setpgid");
  if (prctl(PR_SET_NO_NEW_PRIVS, 1, 0, 0, 0) != 0) die("no_new_privs");

  apply_landlock(workspace);
  apply_seccomp();

  char *envp[] = { NULL };
  execve(program[0], program, envp);
  die("execve");
}
