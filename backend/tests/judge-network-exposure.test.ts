import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

function read(name: string) {
  return readFileSync(join(root, name), "utf8");
}

function composeFiles() {
  return readdirSync(root).filter((name) => /^docker-compose.*\.ya?ml$/.test(name));
}

function judgeBlock(yaml: string) {
  const start = yaml.search(/^  judge:/m);
  if (start < 0) return "";
  const rest = yaml.slice(start);
  const next = rest.search(/\n  [a-zA-Z]/);
  return next < 0 ? rest : rest.slice(0, next);
}

function publishedBindings(yaml: string) {
  const block = judgeBlock(yaml);
  const ports = block.match(/^\s+ports:\s*\n((?:\s+-\s+.+\n)*)/m);
  if (!ports) return [];
  return [...ports[1].matchAll(/-\s*["']?([^"'\n]+)["']?/g)].map((m) => m[1].trim());
}

const ALL_INTERFACE = /^(?:\*|0\.0\.0\.0|\[::\]|::)?(?::)?7080:7080$/;
const LOOPBACK_ONLY = /^127\.0\.0\.1:7080:7080$/;

describe("judge network exposure", () => {
  it("does not publish 7080 on all interfaces in any compose file", () => {
    for (const name of composeFiles()) {
      for (const binding of publishedBindings(read(name))) {
        expect(binding, `${name} ${binding}`).not.toMatch(ALL_INTERFACE);
        expect(binding.startsWith("0.0.0.0:")).toBe(false);
        expect(binding === "7080:7080").toBe(false);
        expect(binding === "7080").toBe(false);
      }
    }
  });

  it("keeps production compose free of any judge host port mapping", () => {
    const prod = read("docker-compose.yml");
    expect(judgeBlock(prod)).not.toMatch(/^\s+ports:/m);
    expect(prod).not.toMatch(/7080:7080/);
    expect(prod).toMatch(/cforge_internal/);
    expect(prod).not.toMatch(/0\.0\.0\.0:7080/);
    expect(prod).toMatch(/JUDGE_BIND:\s*"0\.0\.0\.0"/);
    expect(prod).toMatch(/http:\/\/127\.0\.0\.1:7080\/health/);
  });

  it("binds the local override to loopback only", () => {
    const bindings = publishedBindings(read("docker-compose.override.yml"));
    expect(bindings).toEqual(["127.0.0.1:7080:7080"]);
    expect(bindings.every((b) => LOOPBACK_ONLY.test(b))).toBe(true);
  });

  it("defaults the host judge process to 127.0.0.1", () => {
    const server = read("services/judge/src/server.mjs");
    expect(server).toContain('process.env.JUDGE_BIND || "127.0.0.1"');
    expect(server).not.toMatch(/listen\(\s*PORT,\s*"0\.0\.0\.0"/);
    expect(server).toContain("authorization");
    expect(server).toContain("/health");
  });
});
