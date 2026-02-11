import { describe, expect, test } from "vitest";
import { buildVenmoNote, buildVenmoPayLink } from "@/lib/venmo";

describe("buildVenmoNote", () => {
  test("includes event name and via suffix", () => {
    expect(buildVenmoNote("Cabin Trip")).toBe("Cabin Trip-via.Vensoc");
  });
});

describe("buildVenmoPayLink", () => {
  test("builds a Venmo URL with encoded params", () => {
    const link = buildVenmoPayLink({
      organizerVenmoUsername: "@organizer",
      amount: 24.5,
      eventName: "Cabin Gas",
    });

    const url = new URL(link);

    expect(url.origin).toBe("https://venmo.com");
    expect(url.pathname).toBe("/organizer");
    expect(url.searchParams.get("txn")).toBe("pay");
    expect(url.searchParams.get("amount")).toBe("24.50");
    expect(url.searchParams.get("note")).toBe("Cabin Gas-via.Vensoc");
  });
});
