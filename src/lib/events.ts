import { supabase } from "@/lib/supabase/client";
import type {
  EventRecord,
  OrganizerEventSummary,
  JoinedEventSummary,
  EventWithParticipants,
  ParticipantRecord,
  ParticipantStatus,
} from "@/lib/types";

export function generateEventId(): string {
  return `evt_${Math.random().toString(36).slice(2, 10)}`;
}

export async function createEvent(input: {
  eventName: string;
  amount: number;
  organizerUserId: string;
  eventId?: string;
}): Promise<{ eventId: string }> {
  const eventId = input.eventId ?? generateEventId();

  const { error } = await supabase.from("events").insert({
    id: eventId,
    name: input.eventName.trim(),
    amount: Number(input.amount.toFixed(2)),
    organizer_user_id: input.organizerUserId,
  });

  if (error) {
    throw new Error(error.message);
  }

  return { eventId };
}

export async function deleteEvent(eventId: string): Promise<void> {
  const { error } = await supabase.from("events").delete().eq("id", eventId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function fetchEventWithParticipants(
  eventId: string,
): Promise<EventWithParticipants | null> {
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("*")
    .eq("id", eventId)
    .maybeSingle<EventRecord>();

  if (eventError) {
    throw new Error(eventError.message);
  }

  if (!event) {
    return null;
  }

  const { data: participants, error: participantsError } = await supabase
    .from("participants")
    .select("*")
    .eq("event_id", eventId)
    .order("joined_at", { ascending: true })
    .returns<ParticipantRecord[]>();

  if (participantsError) {
    throw new Error(participantsError.message);
  }

  return {
    event,
    participants: participants ?? [],
  };
}

export async function addParticipant(input: {
  eventId: string;
  name: string;
  participantUserId?: string | null;
  guestIdentityKey?: string | null;
}): Promise<{ participantId: string }> {
  const { data, error } = await supabase
    .from("participants")
    .insert({
      event_id: input.eventId,
      name: input.name.trim(),
      status: "OWES",
      participant_user_id: input.participantUserId ?? null,
      guest_identity_key: input.guestIdentityKey ?? null,
      payment_initiated_at: new Date().toISOString(),
    })
    .select("id")
    .single<{ id: string }>();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Could not save participant.");
  }

  return { participantId: data.id };
}

export async function updateParticipantStatus(input: {
  participantId: string;
  status: ParticipantStatus;
  actorUserId?: string | null;
}): Promise<void> {
  const { error } = await supabase
    .from("participants")
    .update({
      status: input.status,
      marked_paid_at: input.status === "PAID" ? new Date().toISOString() : null,
      status_changed_by_user_id: input.actorUserId ?? null,
    })
    .eq("id", input.participantId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function fetchOrganizerEventSummaries(
  organizerUserId: string,
): Promise<OrganizerEventSummary[]> {
  const { data: events, error: eventsError } = await supabase
    .from("events")
    .select("*")
    .eq("organizer_user_id", organizerUserId)
    .order("created_at", { ascending: false })
    .returns<EventRecord[]>();

  if (eventsError) {
    throw new Error(eventsError.message);
  }

  if (!events || events.length === 0) {
    return [];
  }

  const eventIds = events.map((event) => event.id);
  const { data: participants, error: participantsError } = await supabase
    .from("participants")
    .select("*")
    .in("event_id", eventIds)
    .returns<ParticipantRecord[]>();

  if (participantsError) {
    throw new Error(participantsError.message);
  }

  const participantsByEventId = new Map<string, ParticipantRecord[]>();

  for (const participant of participants ?? []) {
    const current = participantsByEventId.get(participant.event_id) ?? [];
    current.push(participant);
    participantsByEventId.set(participant.event_id, current);
  }

  return events.map((event) => {
    const eventParticipants = participantsByEventId.get(event.id) ?? [];
    const paidCount = eventParticipants.filter(
      (participant) => participant.status === "PAID",
    ).length;

    return {
      event,
      participants: eventParticipants.sort((a, b) =>
        a.joined_at.localeCompare(b.joined_at),
      ),
      paidCount,
      owesCount: eventParticipants.length - paidCount,
    };
  });
}

export async function fetchJoinedEventSummaries(input: {
  userId: string | null;
  guestIdentityKey: string | null;
}): Promise<JoinedEventSummary[]> {
  const filters: string[] = [];

  if (input.userId) {
    filters.push(`participant_user_id.eq.${input.userId}`);
  }

  if (input.guestIdentityKey) {
    filters.push(`guest_identity_key.eq.${input.guestIdentityKey}`);
  }

  if (filters.length === 0) {
    return [];
  }

  const { data: participantRows, error: participantsError } = await supabase
    .from("participants")
    .select("*")
    .or(filters.join(","))
    .order("joined_at", { ascending: false })
    .returns<ParticipantRecord[]>();

  if (participantsError) {
    throw new Error(participantsError.message);
  }

  if (!participantRows || participantRows.length === 0) {
    return [];
  }

  const dedupedByEvent = new Map<string, ParticipantRecord>();

  for (const participant of participantRows) {
    if (!dedupedByEvent.has(participant.event_id)) {
      dedupedByEvent.set(participant.event_id, participant);
    }
  }

  const eventIds = Array.from(dedupedByEvent.keys());

  const { data: events, error: eventsError } = await supabase
    .from("events")
    .select("*")
    .in("id", eventIds)
    .returns<EventRecord[]>();

  if (eventsError) {
    throw new Error(eventsError.message);
  }

  const { data: allParticipants, error: allParticipantsError } = await supabase
    .from("participants")
    .select("event_id,status")
    .in("event_id", eventIds)
    .returns<Array<Pick<ParticipantRecord, "event_id" | "status">>>();

  if (allParticipantsError) {
    throw new Error(allParticipantsError.message);
  }

  const stats = new Map<
    string,
    { paidCount: number; owesCount: number; totalParticipants: number }
  >();

  for (const row of allParticipants ?? []) {
    const current = stats.get(row.event_id) ?? {
      paidCount: 0,
      owesCount: 0,
      totalParticipants: 0,
    };
    current.totalParticipants += 1;
    if (row.status === "PAID") {
      current.paidCount += 1;
    } else {
      current.owesCount += 1;
    }
    stats.set(row.event_id, current);
  }

  const eventsById = new Map((events ?? []).map((event) => [event.id, event]));

  return eventIds
    .map((eventId) => {
      const event = eventsById.get(eventId);
      const participant = dedupedByEvent.get(eventId);

      if (!event || !participant) {
        return null;
      }

      const summary = stats.get(eventId) ?? {
        paidCount: 0,
        owesCount: 0,
        totalParticipants: 0,
      };

      return {
        event,
        participant,
        paidCount: summary.paidCount,
        owesCount: summary.owesCount,
        totalParticipants: summary.totalParticipants,
      };
    })
    .filter((value): value is JoinedEventSummary => value !== null)
    .sort((a, b) => b.participant.joined_at.localeCompare(a.participant.joined_at));
}
