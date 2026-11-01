import { createConnection } from "node:net";
import { watch } from "node:fs";
import { existsSync } from "node:fs";
import { decodeFrames, encodeFrame } from "./protocol.mjs";

export function vsockHostPath(udsPath, port) {
  return `${udsPath}_${port}`;
}

export function waitForVsockPort(udsPath, port, timeoutMs) {
  const path = vsockHostPath(udsPath, port);
  const started = Date.now();
  return new Promise((resolve, reject) => {
    if (existsSync(path)) {
      resolve(path);
      return;
    }
    const watcher = watch(udsPath.replace(/[^/]+$/, "") || ".", () => {
      if (existsSync(path)) {
        watcher.close();
        resolve(path);
      }
    });
    const timer = setInterval(() => {
      if (existsSync(path)) {
        clearInterval(timer);
        watcher.close();
        resolve(path);
        return;
      }
      if (Date.now() - started > timeoutMs) {
        clearInterval(timer);
        watcher.close();
        reject(new Error("vsock_timeout"));
      }
    }, 50);
  });
}

export function requestVsock(path, message, timeoutMs) {
  return new Promise((resolve, reject) => {
    const socket = createConnection(path);
    let buf = Buffer.alloc(0);
    const timer = setTimeout(() => {
      socket.destroy();
      reject(new Error("vsock_rpc_timeout"));
    }, timeoutMs);
    socket.on("connect", () => socket.write(encodeFrame(message)));
    socket.on("data", (chunk) => {
      buf = Buffer.concat([buf, chunk]);
      try {
        const { messages } = decodeFrames(buf);
        if (messages[0]) {
          clearTimeout(timer);
          socket.end();
          resolve(messages[0]);
        }
      } catch (error) {
        clearTimeout(timer);
        socket.destroy();
        reject(error);
      }
    });
    socket.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
  });
}
