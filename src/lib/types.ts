export type ParticipantStatus = "OWES" | "PAID";

export type EventRecord = {
  id: string;
  name: string;
  amount: number;
  organizer_venmo_username: string;
  organizer_user_id: string;
  created_at: string;
};

export type OrganizerProfileRecord = {
  user_id: string;
  venmo_username: string;
  venmo_username_normalized: string;
  created_at: string;
  updated_at: string;
};

export type ParticipantRecord = {
  id: string;
  event_id: string;
  name: string;
  status: ParticipantStatus;
  joined_at: string;
  participant_user_id?: string | null;
  guest_identity_key?: string | null;
  payment_initiated_at?: string | null;
  marked_paid_at?: string | null;
  reminder_count?: number;
  no_show_flag?: boolean;
};

export type EventWithParticipants = {
  event: EventRecord;
  participants: ParticipantRecord[];
};

export type OrganizerEventSummary = {
  event: EventRecord;
  participants: ParticipantRecord[];
  paidCount: number;
  owesCount: number;
};

export type JoinedEventSummary = {
  event: EventRecord;
  participant: ParticipantRecord;
  paidCount: number;
  owesCount: number;
  totalParticipants: number;
};
