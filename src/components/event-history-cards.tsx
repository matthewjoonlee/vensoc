"use client";

import Link from "next/link";
import { useState } from "react";
import { formatShareMessage } from "@/lib/share-message";
import type { OrganizerEventSummary } from "@/lib/types";

type EventHistoryCardsProps = {
  events: OrganizerEventSummary[];
  onDeleteEvent?: (eventId: string) => Promise<void>;
};

function formatCreatedDate(timestamp: string): string {
  return new Date(timestamp).toLocaleDateString();
}

export function EventHistoryCards({ events, onDeleteEvent }: EventHistoryCardsProps) {
  const [feedbackByEventId, setFeedbackByEventId] = useState<Record<string, string>>({});

  const copyMessage = async (eventSummary: OrganizerEventSummary) => {
    const message = formatShareMessage(eventSummary.event, eventSummary.participants);

    try {
      await navigator.clipboard.writeText(message);
      setFeedbackByEventId((current) => ({
        ...current,
        [eventSummary.event.id]: "Message copied.",
      }));
    } catch {
      setFeedbackByEventId((current) => ({
        ...current,
        [eventSummary.event.id]: "Could not copy message.",
      }));
    }
  };

  if (events.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
        No events yet. Create your first event above.
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {events.map((eventSummary) => (
        <li
          key={eventSummary.event.id}
          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-900">{eventSummary.event.name}</h3>
              <p className="mt-1 text-sm text-slate-600">
                ${eventSummary.event.amount.toFixed(2)} each • Created {formatCreatedDate(eventSummary.event.created_at)}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                ✅ {eventSummary.paidCount} paid • ⏳ {eventSummary.owesCount} owes
              </p>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
              <Link
                href={`/event/${eventSummary.event.id}`}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-center text-xs font-semibold text-slate-700 transition hover:bg-slate-100 sm:w-auto"
              >
                Open Event
              </Link>
              <button
                type="button"
                className="w-full rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 sm:w-auto"
                onClick={() => copyMessage(eventSummary)}
              >
                Copy Message
              </button>
              {onDeleteEvent ? (
                <button
                  type="button"
                  className="w-full rounded-lg border border-red-300 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-50 sm:w-auto"
                  onClick={() => onDeleteEvent(eventSummary.event.id)}
                >
                  Delete
                </button>
              ) : null}
            </div>
          </div>
          {feedbackByEventId[eventSummary.event.id] ? (
            <p className="mt-2 text-xs text-slate-500">{feedbackByEventId[eventSummary.event.id]}</p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
