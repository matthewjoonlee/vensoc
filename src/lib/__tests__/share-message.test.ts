import { describe, expect, test } from "vitest";
import { formatShareMessage } from "@/lib/share-message";
import type { EventRecord, ParticipantRecord } from "@/lib/types";

const event: EventRecord = {
  id: "evt_1",
  name: "Snow Trip",
  amount: 18,
  organizer_venmo_username: "tripleader",
  organizer_user_id: "user_1",
  created_at: new Date().toISOString(),
};

const participants: ParticipantRecord[] = [
  {
    id: "p1",
    event_id: "evt_1",
    name: "Alex",
    status: "PAID",
    joined_at: new Date().toISOString(),
  },
  {
    id: "p2",
    event_id: "evt_1",
    name: "Sam",
    status: "OWES",
    joined_at: new Date().toISOString(),
  },
];

describe("formatShareMessage", () => {
  test("matches template with paid and owes lists", () => {
    const message = formatShareMessage(event, participants);

    expect(message).toContain("Snow Trip ($18.00 each)");
    expect(message).toContain("✅ Paid: Alex");
    expect(message).toContain("⏳ Owes: Sam");
    expect(message).toContain("Pay here: https://venmo.com/tripleader?txn=pay&amount=18.00");
    expect(message).toContain("note=Snow+Trip-via.Vensoc");
  });

  test("shows None when no one is in a list", () => {
    const message = formatShareMessage(event, []);

    expect(message).toContain("✅ Paid: None");
    expect(message).toContain("⏳ Owes: None");
  });
});
