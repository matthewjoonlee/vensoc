"use client";

type PostJoinAuthPromptProps = {
  isOpen: boolean;
  onContinueGuest: () => void;
  onSignIn: () => void;
  isLoading: boolean;
};

export function PostJoinAuthPrompt({
  isOpen,
  onContinueGuest,
  onSignIn,
  isLoading,
}: PostJoinAuthPromptProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-white p-6 text-slate-900 shadow-2xl">
        <h2 className="text-xl font-semibold">Save your activity?</h2>
        <p className="mt-2 text-sm text-slate-600">
          Sign in to save joined events to your account, or continue as guest.
        </p>

        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
            onClick={onSignIn}
            disabled={isLoading}
          >
            {isLoading ? "Redirecting..." : "Sign in to save"}
          </button>
          <button
            type="button"
            className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-70"
            onClick={onContinueGuest}
            disabled={isLoading}
          >
            Continue as guest
          </button>
        </div>
      </div>
    </div>
  );
}
