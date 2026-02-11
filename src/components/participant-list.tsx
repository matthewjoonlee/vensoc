"use client";

import type { ParticipantRecord, ParticipantStatus } from "@/lib/types";

type ParticipantListProps = {
  participants: ParticipantRecord[];
  canManageStatus: boolean;
  isUpdating: boolean;
  highlightedParticipantId?: string | null;
  onToggleStatus: (participantId: string, nextStatus: ParticipantStatus) => Promise<void>;
};

function badgeStyles(status: ParticipantStatus): string {
  if (status === "PAID") {
    return "bg-emerald-100 text-emerald-700 border-emerald-200";
  }

  return "bg-amber-100 text-amber-700 border-amber-200";
}

export function ParticipantList({
  participants,
  canManageStatus,
  isUpdating,
  highlightedParticipantId,
  onToggleStatus,
}: ParticipantListProps) {
  if (participants.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
        No participants yet.
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {participants.map((participant) => {
        const nextStatus: ParticipantStatus =
          participant.status === "OWES" ? "PAID" : "OWES";

        return (
          <li
            key={participant.id}
            className={`flex flex-col gap-3 rounded-2xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${
              highlightedParticipantId === participant.id
                ? "border-cyan-300 bg-cyan-50"
                : "border-slate-200 bg-white"
            }`}
          >
            <div>
              <p className="font-semibold text-slate-900">
                {participant.name}
                {highlightedParticipantId === participant.id ? (
                  <span className="ml-2 rounded-full bg-cyan-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-cyan-700">
                    You
                  </span>
                ) : null}
              </p>
              <p className="text-xs text-slate-500">Joined tracker</p>
            </div>

            <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-end">
              <span
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${badgeStyles(participant.status)}`}
              >
                {participant.status}
              </span>
              {canManageStatus ? (
                <button
                  type="button"
                  className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={() => onToggleStatus(participant.id, nextStatus)}
                  disabled={isUpdating}
                >
                  Mark {nextStatus}
                </button>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
