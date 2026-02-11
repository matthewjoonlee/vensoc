"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CompletionBanner } from "@/components/completion-banner";
import { JoinPayModal } from "@/components/join-pay-modal";
import { PostJoinAuthPrompt } from "@/components/post-join-auth-prompt";
import { ParticipantList } from "@/components/participant-list";
import { ShareStatusButton } from "@/components/share-status-button";
import {
  addParticipant,
  deleteEvent,
  fetchEventWithParticipants,
  updateParticipantStatus,
} from "@/lib/events";
import { getOrCreateGuestIdentityKey } from "@/lib/guest-identity";
import { formatShareMessage } from "@/lib/share-message";
import { supabase } from "@/lib/supabase/client";
import type { EventRecord, ParticipantRecord, ParticipantStatus } from "@/lib/types";
import { buildVenmoPayLink } from "@/lib/venmo";

type EventState = {
  event: EventRecord;
  participants: ParticipantRecord[];
};

export default function EventDetailPage() {
  const params = useParams<{ eventId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventId = params.eventId;

  const [state, setState] = useState<EventState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserName, setCurrentUserName] = useState("");
  const [linkFeedback, setLinkFeedback] = useState<string | null>(null);
  const [isAuthPromptLoading, setIsAuthPromptLoading] = useState(false);
  const hasAutoOpenedJoin = useRef(false);
  const shouldOpenJoinFromQuery = searchParams.get("open_join") === "1";
  const guestIdentityKey =
    typeof window === "undefined" ? "" : getOrCreateGuestIdentityKey();

  const loadEvent = useCallback(async () => {
    try {
      const data = await fetchEventWithParticipants(eventId);
      if (!data) {
        setState(null);
      } else {
        setState(data);
      }
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "Could not load event.",
      );
    }

    setIsLoading(false);
  }, [eventId]);

  useEffect(() => {
    const run = async () => {
      await loadEvent();
    };

    void run();
  }, [loadEvent]);

  useEffect(() => {
    const refreshOnReturn = () => {
      void loadEvent();
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshOnReturn();
      }
    };

    window.addEventListener("focus", refreshOnReturn);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.removeEventListener("focus", refreshOnReturn);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [loadEvent]);

  useEffect(() => {
    const run = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setCurrentUserId(user?.id ?? null);

      if (user) {
        const metadataName =
          (user.user_metadata?.full_name as string | undefined) ??
          (user.user_metadata?.name as string | undefined) ??
          "";
        const emailName = user.email ? user.email.split("@")[0] : "";
        setCurrentUserName(metadataName || emailName);

        if (shouldOpenJoinFromQuery && !hasAutoOpenedJoin.current) {
          hasAutoOpenedJoin.current = true;
          setShowJoinModal(true);
        }
      } else {
        setCurrentUserName("");
      }
    };

    void run();
  }, [shouldOpenJoinFromQuery]);

  const isOrganizer =
    currentUserId !== null && state?.event.organizer_user_id === currentUserId;
  const currentParticipant = useMemo(() => {
    if (!state) {
      return null;
    }

    const matches = state.participants.filter((participant) => {
      const matchesUserId =
        Boolean(currentUserId) && participant.participant_user_id === currentUserId;
      const matchesGuestKey =
        Boolean(guestIdentityKey) &&
        participant.guest_identity_key === guestIdentityKey;

      return matchesUserId || matchesGuestKey;
    });

    if (matches.length === 0) {
      return null;
    }

    return matches.sort((a, b) => b.joined_at.localeCompare(a.joined_at))[0];
  }, [currentUserId, guestIdentityKey, state]);

  const hasAlreadyJoined = Boolean(currentParticipant);
  const hasAlreadyPaid = currentParticipant?.status === "PAID";
  const participantsForDisplay = useMemo(() => {
    if (!state) {
      return [];
    }

    if (!currentParticipant) {
      return state.participants;
    }

    return [
      currentParticipant,
      ...state.participants.filter(
        (participant) => participant.id !== currentParticipant.id,
      ),
    ];
  }, [currentParticipant, state]);
  const eventUrl = typeof window === "undefined" ? "" : window.location.href;

  const shareMessage = useMemo(() => {
    if (!state) {
      return "";
    }

    return formatShareMessage(state.event, state.participants);
  }, [state]);

  const handleJoin = async (participantName: string) => {
    if (!state) {
      return;
    }

    if (hasAlreadyJoined) {
      setError("You have already joined this event.");
      setShowJoinModal(false);
      return;
    }

    await addParticipant({
      eventId: state.event.id,
      name: participantName,
      participantUserId: currentUserId,
      guestIdentityKey,
    });

    const link = buildVenmoPayLink({
      organizerVenmoUsername: state.event.organizer_venmo_username,
      amount: state.event.amount,
      eventName: state.event.name,
    });

    window.location.href = link;
  };

  const openJoinFlow = () => {
    if (isOrganizer) {
      return;
    }
    if (hasAlreadyJoined) {
      return;
    }

    if (currentUserId) {
      setShowJoinModal(true);
      return;
    }

    setShowAuthPrompt(true);
  };

  const continueAsGuest = () => {
    setShowAuthPrompt(false);
    setShowJoinModal(true);
  };

  const continueWithSignIn = () => {
    setIsAuthPromptLoading(true);
    const nextPath = `/event/${eventId}?open_join=1`;
    window.location.href = `/login?next=${encodeURIComponent(nextPath)}`;
  };

  const handleToggleStatus = async (
    participantId: string,
    nextStatus: ParticipantStatus,
  ) => {
    setIsUpdating(true);
    setError(null);

    try {
      await updateParticipantStatus({
        participantId,
        status: nextStatus,
        actorUserId: currentUserId,
      });
      await loadEvent();
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Could not update participant status.",
      );
    }

    setIsUpdating(false);
  };

  const copyEventLink = async () => {
    try {
      await navigator.clipboard.writeText(eventUrl);
      setLinkFeedback("Event link copied.");
    } catch {
      setLinkFeedback("Could not copy event link.");
    }
  };

  const handleDeleteEvent = async () => {
    if (!state || !isOrganizer) {
      return;
    }

    const shouldDelete = window.confirm(
      "Delete this event? This will remove all participants and cannot be undone.",
    );

    if (!shouldDelete) {
      return;
    }

    try {
      await deleteEvent(state.event.id);
      router.push("/");
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Could not delete event.",
      );
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900 sm:px-6 sm:py-12">
        <div className="mx-auto w-full max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 shadow-lg sm:p-8">
          <p className="text-sm text-slate-600">Loading event...</p>
        </div>
      </main>
    );
  }

  if (!state) {
    return (
      <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900 sm:px-6 sm:py-12">
        <div className="mx-auto w-full max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 shadow-lg sm:p-8">
          <h1 className="text-2xl font-semibold">Event not found</h1>
          <p className="mt-3 text-sm text-slate-600">
            This link may be malformed or the event was removed.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          >
            Back to organizer page
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900 sm:px-6 sm:py-12">
      <div className="mx-auto w-full max-w-3xl space-y-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-lg sm:p-8">
        <div className="flex justify-start">
          <Link
            href="/"
            className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Back to Home
          </Link>
        </div>
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Vensoc Event</p>
          <h1 className="text-3xl font-semibold">{state.event.name}</h1>
          <p className="text-sm text-slate-600">
            ${state.event.amount.toFixed(2)} each • Pay @{state.event.organizer_venmo_username}
          </p>
          <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
            <p className="text-xs text-slate-600">Share this link: {eventUrl || "Loading..."}</p>
            <button
              type="button"
              className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
              onClick={copyEventLink}
              disabled={!eventUrl}
            >
              Copy event link
            </button>
            {linkFeedback ? <p className="text-xs text-slate-500">{linkFeedback}</p> : null}
          </div>
        </header>

        <CompletionBanner participants={state.participants} />

        {error ? (
          <p className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          {!isOrganizer && !hasAlreadyJoined ? (
            <button
              type="button"
              className="w-full rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-400 sm:w-auto"
              onClick={openJoinFlow}
            >
              Join and Pay
            </button>
          ) : hasAlreadyJoined ? (
            <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {hasAlreadyPaid
                ? "You already joined and paid for this event."
                : "You already joined this event."}
            </p>
          ) : (
            <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              You cannot join your own event as a participant.
            </p>
          )}
          {isOrganizer ? <ShareStatusButton message={shareMessage} /> : null}
          {isOrganizer ? (
            <button
              type="button"
              className="w-full rounded-xl border border-red-300 px-4 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-50 sm:w-auto"
              onClick={handleDeleteEvent}
            >
              Delete Event
            </button>
          ) : null}
        </div>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-900">Participants</h2>
          <ParticipantList
            participants={participantsForDisplay}
            canManageStatus={Boolean(isOrganizer)}
            isUpdating={isUpdating}
            highlightedParticipantId={currentParticipant?.id ?? null}
            onToggleStatus={handleToggleStatus}
          />
          {!isOrganizer ? (
            <p className="text-xs text-slate-500">
              Organizer controls appear after organizer login.
            </p>
          ) : null}
        </section>
      </div>

      <JoinPayModal
        key={`${showJoinModal ? "open" : "closed"}-${currentUserId ?? "guest"}-${currentUserName}`}
        isOpen={showJoinModal}
        eventName={state.event.name}
        onClose={() => setShowJoinModal(false)}
        initialName={currentUserName}
        onConfirm={handleJoin}
      />
      <PostJoinAuthPrompt
        isOpen={showAuthPrompt}
        onContinueGuest={continueAsGuest}
        onSignIn={continueWithSignIn}
        isLoading={isAuthPromptLoading}
      />
    </main>
  );
}
