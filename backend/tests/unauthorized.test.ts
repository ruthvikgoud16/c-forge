import { describe, expect, it } from "vitest";
import { loginStudent, acceptInvite } from "@/lib/academy/onboard";
import { resetStore } from "@/lib/academy/store";

describe("unauthorized student", () => {
  it("rejects unknown credentials and leftover tokens", async () => {
    resetStore();
    expect(await loginStudent("nobody", "password1234")).toBeNull();
    const rejected = await acceptInvite({
      token: "not-a-real-invite",
      rollIdentifier: "s1",
      password: "password1234",
    });
    expect(rejected.ok).toBe(false);
  });
});
