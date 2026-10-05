import { describe, expect, it } from "vitest";
import { friendlyError } from "./errors";

describe("friendlyError", () => {
  it.each([
    ["JWT expired", "Your session has ended. Please sign in again."],
    ["Invalid Refresh Token: Refresh Token Not Found", "Your session has ended. Please sign in again."],
    ["Failed to fetch", "No connection. Check your internet and try again."],
    ["TypeError: NetworkError when attempting to fetch resource.", "No connection. Check your internet and try again."],
    ["Load failed", "No connection. Check your internet and try again."],
    ['permission denied for table employees', "You don’t have access to do that. If your access was removed, ask an Admin to approve your email again."],
    ['new row violates row-level security policy for table "employees"', "You don’t have access to do that. If your access was removed, ask an Admin to approve your email again."],
  ])("%s", (raw, expected) => {
    expect(friendlyError(raw)).toBe(expected);
  });

  it("leaves the database's own messages alone", () => {
    for (const m of [
      "That month is closed. Reopen it to make changes.",
      "Arrival cannot be recorded for a future date.",
      "This employee has records, so they cannot be deleted. Set a last working date instead.",
      "This month has not ended yet, so it cannot be closed.",
    ]) {
      expect(friendlyError(m)).toBe(m);
    }
  });
});
