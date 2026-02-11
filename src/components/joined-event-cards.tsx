"use client";

import Link from "next/link";
import type { JoinedEventSummary } from "@/lib/types";

type JoinedEventCardsProps = {
  events: JoinedEventSummary[];
};

function formatDate(timestamp: string): string {
  return new Date(timestamp).toLocaleDateString();
}

export function JoinedEventCards({ events }: JoinedEventCardsProps) {
  if (events.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
        No joined events yet.
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {events.map((eventSummary) => (
        <li
          key={`${eventSummary.event.id}-${eventSummary.participant.id}`}
          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-900">{eventSummary.event.name}</h3>
              <p className="mt-1 text-sm text-slate-600">
                ${eventSummary.event.amount.toFixed(2)} each • Joined {formatDate(eventSummary.participant.joined_at)}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Your status: {eventSummary.participant.status} • Group: ✅ {eventSummary.paidCount} / ⏳ {eventSummary.owesCount}
              </p>
            </div>
            <Link
              href={`/event/${eventSummary.event.id}`}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-center text-xs font-semibold text-slate-700 transition hover:bg-slate-100 sm:w-auto"
            >
              Open Event
            </Link>
          </div>
        </li>
      ))}
    </ul>
  );
}
