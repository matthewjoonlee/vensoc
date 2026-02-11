import type { ParticipantRecord } from "@/lib/types";

type CompletionBannerProps = {
  participants: ParticipantRecord[];
};

export function CompletionBanner({ participants }: CompletionBannerProps) {
  const isComplete =
    participants.length > 0 &&
    participants.every((participant) => participant.status === "PAID");

  if (!isComplete) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-emerald-800">
      <p className="text-sm uppercase tracking-[0.2em]">Complete</p>
      <p className="mt-1 text-lg font-semibold">Everyone has paid. Nice work.</p>
    </div>
  );
}
