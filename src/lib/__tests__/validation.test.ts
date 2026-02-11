import { describe, expect, test } from "vitest";
import {
  normalizeVenmoUsername,
  validateEventForm,
  validateParticipantName,
  validateVenmoUsername,
} from "@/lib/validation";

describe("normalizeVenmoUsername", () => {
  test("trims, strips @, and lowercases", () => {
    expect(normalizeVenmoUsername("  @Alice_123  ")).toBe("alice_123");
  });
});

describe("validateEventForm", () => {
  test("returns field errors for empty values", () => {
    const result = validateEventForm({
      eventName: "",
      amount: "",
    });

    expect(result.fieldErrors.eventName).toBeTruthy();
    expect(result.fieldErrors.amount).toBeTruthy();
    expect(result.parsedAmount).toBeNull();
  });

  test("accepts valid input with decimal amount", () => {
    const result = validateEventForm({
      eventName: "Weekend Gas",
      amount: "12.50",
    });

    expect(result.fieldErrors).toEqual({});
    expect(result.parsedAmount).toBe(12.5);
  });
});

describe("validateVenmoUsername", () => {
  test("requires valid venmo username format", () => {
    expect(validateVenmoUsername("")).toBeTruthy();
    expect(validateVenmoUsername("@ab")).toBeTruthy();
    expect(validateVenmoUsername("@valid_name")).toBeNull();
  });
});

describe("validateParticipantName", () => {
  test("requires non-empty names", () => {
    expect(validateParticipantName("   ")).toBeTruthy();
    expect(validateParticipantName("Alex")).toBeNull();
  });
});
