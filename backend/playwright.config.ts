import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://127.0.0.1:3010",
    headless: true,
  },
  webServer: process.env.E2E_NO_WEBSERVER
    ? undefined
    : {
        command: "npx next dev --hostname 127.0.0.1 --port 3010",
        url: "http://127.0.0.1:3010",
        reuseExistingServer: false,
        timeout: 120_000,
        env: {
          ...process.env,
          ALLOW_DEV_INVITE: "1",
          DEV_INVITE_TOKEN: "e2e-dev-invite",
          FACULTY_TOKEN: process.env.FACULTY_TOKEN ?? "e2e-faculty-token",
          DATABASE_URL: "",
          FACULTY_DATABASE_URL: "",
          MIGRATOR_DATABASE_URL: "",
        },
      },
});
