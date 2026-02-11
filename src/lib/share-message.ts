import type { EventRecord, ParticipantRecord } from "@/lib/types";
import { buildVenmoPayLink } from "@/lib/venmo";

function buildNameList(participants: ParticipantRecord[]): string {
  if (participants.length === 0) {
    return "None";
  }

  return participants.map((participant) => participant.name).join(", ");
}

export function formatShareMessage(
  event: EventRecord,
  participants: ParticipantRecord[],
): string {
  const paid = participants.filter((participant) => participant.status === "PAID");
  const owes = participants.filter((participant) => participant.status === "OWES");
  const payLink = buildVenmoPayLink({
    organizerVenmoUsername: event.organizer_venmo_username,
    amount: event.amount,
    eventName: event.name,
  });

  return [
    `${event.name} ($${event.amount.toFixed(2)} each)`,
    "",
    `✅ Paid: ${buildNameList(paid)}`,
    `⏳ Owes: ${buildNameList(owes)}`,
    "",
    `Pay here: ${payLink}`,
  ].join("\n");
}
