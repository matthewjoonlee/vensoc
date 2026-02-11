"use client";

import { useState } from "react";
import { validateParticipantName } from "@/lib/validation";

type JoinPayModalProps = {
  isOpen: boolean;
  eventName: string;
  initialName?: string;
  onClose: () => void;
  onConfirm: (name: string) => Promise<void>;
};

export function JoinPayModal({
  isOpen,
  eventName,
  initialName = "",
  onClose,
  onConfirm,
}: JoinPayModalProps) {
  const [name, setName] = useState(initialName);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationError = validateParticipantName(name);

    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await onConfirm(name.trim());
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Could not continue to Venmo.",
      );
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-white p-6 text-slate-900 shadow-2xl">
        <h2 className="text-xl font-semibold">Join {eventName}</h2>
        <p className="mt-2 text-sm text-slate-600">
          Enter your name to be added to the tracker before paying in Venmo.
        </p>

        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-slate-700">
            Your name
            <input
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-300"
              type="text"
              name="participant-name"
              value={name}
              onChange={(inputEvent) => setName(inputEvent.target.value)}
              placeholder="Alex"
              autoFocus
            />
          </label>

          {error ? (
            <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 sm:w-auto"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-full rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Redirecting..." : "Continue to Venmo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
