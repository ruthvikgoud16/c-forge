/* CForge guest PID 1 / vsock agent. Built only inside the Linux rootfs image. */
#define _GNU_SOURCE
#include <arpa/inet.h>
#include <errno.h>
#include <linux/vm_sockets.h>
#include <signal.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/mount.h>
#include <sys/reboot.h>
#include <sys/resource.h>
#include <sys/socket.h>
#include <sys/stat.h>
#include <sys/wait.h>
#include <unistd.h>

#define PORT 5252
#define MAX_FRAME 131072
#define OUT_CAP 65536

static int compiled_once;

static void die(const char *msg) {
  perror(msg);
  _exit(1);
}

static void setup_fs(void) {
  mkdir("/proc", 0755);
  mkdir("/sys", 0755);
  mkdir("/tmp", 0755);
  mkdir("/work", 0755);
  mkdir("/dev", 0755);
  mount("proc", "/proc", "proc", 0, NULL);
  mount("sysfs", "/sys", "sysfs", 0, NULL);
  mount("tmpfs", "/tmp", "tmpfs", 0, "size=16m");
  mount("tmpfs", "/work", "tmpfs", 0, "size=32m");
  mount("tmpfs", "/dev", "tmpfs", 0, NULL);
}

static void set_limits(int cpu_sec, size_t as_bytes, int nproc, size_t fsize) {
  struct rlimit lim;
  lim.rlim_cur = lim.rlim_max = (rlim_t)cpu_sec;
  setrlimit(RLIMIT_CPU, &lim);
  lim.rlim_cur = lim.rlim_max = (rlim_t)as_bytes;
  setrlimit(RLIMIT_AS, &lim);
  lim.rlim_cur = lim.rlim_max = (rlim_t)nproc;
  setrlimit(RLIMIT_NPROC, &lim);
  lim.rlim_cur = lim.rlim_max = (rlim_t)fsize;
  setrlimit(RLIMIT_FSIZE, &lim);
  lim.rlim_cur = lim.rlim_max = 0;
  setrlimit(RLIMIT_CORE, &lim);
}

static int read_full(int fd, void *buf, size_t n) {
  size_t got = 0;
  while (got < n) {
    ssize_t r = read(fd, (char *)buf + got, n - got);
    if (r <= 0) return -1;
    got += (size_t)r;
  }
  return 0;
}

static int write_full(int fd, const void *buf, size_t n) {
  size_t sent = 0;
  while (sent < n) {
    ssize_t w = write(fd, (const char *)buf + sent, n - sent);
    if (w <= 0) return -1;
    sent += (size_t)w;
  }
  return 0;
}

static int send_json(int fd, const char *json) {
  uint32_t n = (uint32_t)strlen(json);
  uint32_t be = htonl(n);
  if (write_full(fd, &be, 4) < 0) return -1;
  return write_full(fd, json, n);
}

static char *recv_json(int fd) {
  uint32_t be = 0;
  if (read_full(fd, &be, 4) < 0) return NULL;
  uint32_t n = ntohl(be);
  if (n == 0 || n > MAX_FRAME) return NULL;
  char *buf = malloc(n + 1);
  if (!buf) return NULL;
  if (read_full(fd, buf, n) < 0) {
    free(buf);
    return NULL;
  }
  buf[n] = 0;
  return buf;
}

static int json_is(const char *body, const char *op) {
  char needle[64];
  snprintf(needle, sizeof needle, "\"op\":\"%s\"", op);
  return strstr(body, needle) != NULL;
}

static char *json_string(const char *body, const char *key) {
  char needle[64];
  snprintf(needle, sizeof needle, "\"%s\":\"", key);
  const char *p = strstr(body, needle);
  if (!p) return NULL;
  p += strlen(needle);
  char *out = malloc(MAX_FRAME);
  if (!out) return NULL;
  size_t n = 0;
  while (*p && *p != '"' && n + 1 < MAX_FRAME) {
    if (*p == '\\' && p[1]) {
      p++;
      if (*p == 'n') out[n++] = '\n';
      else if (*p == 't') out[n++] = '\t';
      else out[n++] = *p;
      p++;
      continue;
    }
    out[n++] = *p++;
  }
  out[n] = 0;
  return out;
}

static void json_escape_into(char *dst, size_t cap, const char *src) {
  size_t n = 0;
  while (*src && n + 2 < cap) {
    if (*src == '\\' || *src == '"') {
      dst[n++] = '\\';
      dst[n++] = *src++;
    } else if (*src == '\n') {
      dst[n++] = '\\';
      dst[n++] = 'n';
      src++;
    } else {
      dst[n++] = *src++;
    }
  }
  dst[n] = 0;
}

static void do_compile(int fd, const char *body) {
  char *source = json_string(body, "source");
  if (!source || compiled_once) {
    send_json(fd, "{\"op\":\"compiled\",\"ok\":false,\"compiler\":\"already_compiled\"}");
    free(source);
    return;
  }
  FILE *f = fopen("/work/main.c", "w");
  if (!f) {
    send_json(fd, "{\"op\":\"compiled\",\"ok\":false,\"compiler\":\"write_failed\"}");
    free(source);
    return;
  }
  fputs(source, f);
  fclose(f);
  free(source);

  pid_t pid = fork();
  if (pid == 0) {
    set_limits(2, 192u * 1024u * 1024u, 32, 8u * 1024u * 1024u);
    alarm(4);
    char *argv[] = {"gcc-13", "-std=c11", "-O0", "-pipe", "-o", "/work/main", "/work/main.c", NULL};
    char *envp[] = {"PATH=/usr/bin:/bin", "HOME=/work", "LC_ALL=C", NULL};
    execve("/usr/bin/gcc-13", argv, envp);
    argv[0] = "gcc";
    execve("/usr/bin/gcc", argv, envp);
    _exit(127);
  }
  int status = 0;
  waitpid(pid, &status, 0);
  if (WIFEXITED(status) && WEXITSTATUS(status) == 0) {
    compiled_once = 1;
    send_json(fd, "{\"op\":\"compiled\",\"ok\":true}");
  } else {
    send_json(fd, "{\"op\":\"compiled\",\"ok\":false,\"compiler\":\"compile_error\"}");
  }
}

static void do_run(int fd, const char *body) {
  if (!compiled_once || access("/work/main", X_OK) != 0) {
    send_json(fd, "{\"op\":\"result\",\"status\":\"runtime_error\",\"stdout\":\"\",\"stderr\":\"not_compiled\",\"exitCode\":1}");
    return;
  }
  char *stdin_data = json_string(body, "stdin");
  mkdir("/work/run", 0700);
  int inpipe[2], outpipe[2], errpipe[2];
  if (pipe(inpipe) || pipe(outpipe) || pipe(errpipe)) {
    send_json(fd, "{\"op\":\"result\",\"status\":\"runtime_error\",\"stdout\":\"\",\"stderr\":\"pipe\",\"exitCode\":1}");
    free(stdin_data);
    return;
  }
  pid_t pid = fork();
  if (pid == 0) {
    if (chdir("/work/run") != 0) _exit(127);
    dup2(inpipe[0], 0);
    dup2(outpipe[1], 1);
    dup2(errpipe[1], 2);
    close(inpipe[0]);
    close(inpipe[1]);
    close(outpipe[0]);
    close(outpipe[1]);
    close(errpipe[0]);
    close(errpipe[1]);
    set_limits(1, 64u * 1024u * 1024u, 1, 65536);
    alarm(2);
    char *argv[] = {"/work/main", NULL};
    char *envp[] = {NULL};
    execve("/work/main", argv, envp);
    _exit(127);
  }
  close(inpipe[0]);
  close(outpipe[1]);
  close(errpipe[1]);
  if (stdin_data && stdin_data[0]) write_full(inpipe[1], stdin_data, strlen(stdin_data));
  close(inpipe[1]);
  free(stdin_data);

  char stdout_buf[OUT_CAP + 1];
  char stderr_buf[OUT_CAP + 1];
  size_t so = 0, se = 0;
  char tmp[4096];
  ssize_t r;
  while ((r = read(outpipe[0], tmp, sizeof tmp)) > 0) {
    size_t take = (size_t)r;
    if (so + take > OUT_CAP) take = OUT_CAP - so;
    memcpy(stdout_buf + so, tmp, take);
    so += take;
    if (so >= OUT_CAP) break;
  }
  stdout_buf[so] = 0;
  while ((r = read(errpipe[0], tmp, sizeof tmp)) > 0) {
    size_t take = (size_t)r;
    if (se + take > OUT_CAP) take = OUT_CAP - se;
    memcpy(stderr_buf + se, tmp, take);
    se += take;
    if (se >= OUT_CAP) break;
  }
  stderr_buf[se] = 0;
  close(outpipe[0]);
  close(errpipe[0]);
  int status = 0;
  waitpid(pid, &status, 0);

  const char *st = "ok";
  int code = 1;
  if (WIFSIGNALED(status) && (WTERMSIG(status) == SIGALRM || WTERMSIG(status) == SIGXCPU || WTERMSIG(status) == SIGKILL)) {
    st = "timeout";
    code = -1;
  } else if (WIFEXITED(status)) {
    code = WEXITSTATUS(status);
    st = code == 0 ? "ok" : "runtime_error";
  }

  char esc_out[OUT_CAP * 2];
  char esc_err[OUT_CAP * 2];
  json_escape_into(esc_out, sizeof esc_out, stdout_buf);
  json_escape_into(esc_err, sizeof esc_err, stderr_buf);
  char reply[OUT_CAP * 4 + 256];
  snprintf(reply, sizeof reply,
           "{\"op\":\"result\",\"status\":\"%s\",\"stdout\":\"%s\",\"stderr\":\"%s\",\"exitCode\":%d}",
           st, esc_out, esc_err, code);
  send_json(fd, reply);
}

int main(void) {
  setup_fs();
  int s = socket(AF_VSOCK, SOCK_STREAM, 0);
  if (s < 0) die("socket");
  struct sockaddr_vm addr;
  memset(&addr, 0, sizeof addr);
  addr.svm_family = AF_VSOCK;
  addr.svm_cid = VMADDR_CID_ANY;
  addr.svm_port = PORT;
  if (bind(s, (struct sockaddr *)&addr, sizeof addr) < 0) die("bind");
  if (listen(s, 1) < 0) die("listen");
  for (;;) {
    int c = accept(s, NULL, NULL);
    if (c < 0) continue;
    char *body = recv_json(c);
    if (!body) {
      close(c);
      continue;
    }
    if (json_is(body, "compile")) {
      do_compile(c, body);
    } else if (json_is(body, "run")) {
      do_run(c, body);
    } else if (json_is(body, "shutdown")) {
      send_json(c, "{\"op\":\"result\",\"status\":\"ok\",\"stdout\":\"\",\"stderr\":\"\"}");
      free(body);
      close(c);
      sync();
      reboot(RB_POWER_OFF);
      _exit(0);
    }
    free(body);
    close(c);
  }
}
