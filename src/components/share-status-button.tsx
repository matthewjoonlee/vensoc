"use client";

import { useState } from "react";

type ShareStatusButtonProps = {
  message: string;
};

export function ShareStatusButton({ message }: ShareStatusButtonProps) {
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setFeedback("Copied status message.");
    } catch {
      setFeedback("Could not copy. Please copy manually.");
    }
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 sm:w-auto"
        onClick={handleCopy}
      >
        Copy Group Status
      </button>
      {feedback ? <p className="text-xs text-slate-600">{feedback}</p> : null}
    </div>
  );
}
