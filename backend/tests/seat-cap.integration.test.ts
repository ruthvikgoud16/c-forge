import { describe, expect, it } from "vitest";
import { sha256 } from "@/lib/academy/crypto";
import { AcademyStore, SEAT_CAP, SeatCapError } from "@/lib/academy/store";

describe("55-seat cap", () => {
  it("rejects the 56th active student", () => {
    const store = new AcademyStore();
    for (let i = 0; i < SEAT_CAP; i += 1) {
      const token = sha256(`invite-${i}`);
      store.addInvitation(token, 60_000, `roll${i}`);
      expect(
        store.consumeInvitation(token, {
          id: `s-${i}`,
          rollIdentifier: `roll${i}`,
          passwordHash: "x",
          status: "active",
        }).ok,
      ).toBe(true);
    }
    const overflow = sha256("overflow");
    store.addInvitation(overflow, 60_000, "roll56");
    expect(() =>
      store.consumeInvitation(overflow, {
        id: "s-56",
        rollIdentifier: "roll56",
        passwordHash: "x",
        status: "active",
      }),
    ).toThrow(SeatCapError);
    expect(store.activeCount()).toBe(55);
  });
});
