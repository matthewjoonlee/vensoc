"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { EventHistoryCards } from "@/components/event-history-cards";
import { JoinedEventCards } from "@/components/joined-event-cards";
import {
  createEvent,
  deleteEvent,
  fetchJoinedEventSummaries,
  fetchOrganizerEventSummaries,
} from "@/lib/events";
import { getOrCreateGuestIdentityKey } from "@/lib/guest-identity";
import { fetchOrganizerProfile, upsertOrganizerProfile } from "@/lib/profiles";
import { supabase } from "@/lib/supabase/client";
import type {
  JoinedEventSummary,
  OrganizerEventSummary,
  OrganizerProfileRecord,
} from "@/lib/types";
import {
  type EventFormInput,
  validateEventForm,
  validateVenmoUsername,
} from "@/lib/validation";

type FormErrors = Partial<Record<keyof EventFormInput, string>>;
type HomeTab = "organized" | "joined";

function HomeLoadingScreen() {
  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900 sm:px-6 sm:py-12">
      <div className="mx-auto flex w-full max-w-2xl items-center justify-center rounded-3xl border border-slate-200 bg-white p-8 shadow-lg sm:p-12">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Vensoc</p>
            <p className="text-lg font-semibold text-slate-900">Loading your activity...</p>
            <p className="text-sm text-slate-600">
              Fetching your profile and events.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const [eventsError, setEventsError] = useState<string | null>(null);
  const [organizerEvents, setOrganizerEvents] = useState<OrganizerEventSummary[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);

  const [joinedEvents, setJoinedEvents] = useState<JoinedEventSummary[]>([]);
  const [joinedError, setJoinedError] = useState<string | null>(null);
  const [isLoadingJoined, setIsLoadingJoined] = useState(false);

  const [activeTab, setActiveTab] = useState<HomeTab>("organized");

  const [organizerProfile, setOrganizerProfile] =
    useState<OrganizerProfileRecord | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileVenmoInput, setProfileVenmoInput] = useState("");
  const [showEditVenmoModal, setShowEditVenmoModal] = useState(false);

  const [form, setForm] = useState<EventFormInput>({
    eventName: "",
    amount: "",
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  useEffect(() => {
    const run = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUserId(user?.id ?? null);
      setCheckingAuth(false);
    };

    void run();
  }, []);

  useEffect(() => {
    if (!userId) {
      return;
    }

    const run = async () => {
      setProfileError(null);
      setIsLoadingProfile(true);

      try {
        const profile = await fetchOrganizerProfile(userId);
        setOrganizerProfile(profile);
        setProfileVenmoInput(profile?.venmo_username ?? "");
      } catch (loadError) {
        setProfileError(
          loadError instanceof Error
            ? loadError.message
            : "Could not load your Venmo profile.",
        );
      }

      setIsLoadingProfile(false);
    };

    void run();
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      return;
    }

    const run = async () => {
      setEventsError(null);
      setIsLoadingEvents(true);

      try {
        const eventSummaries = await fetchOrganizerEventSummaries(userId);
        setOrganizerEvents(eventSummaries);
      } catch (loadError) {
        setEventsError(
          loadError instanceof Error ? loadError.message : "Could not load your events.",
        );
      }

      setIsLoadingEvents(false);
    };

    void run();
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      return;
    }

    const run = async () => {
      setJoinedError(null);
      setIsLoadingJoined(true);

      try {
        const guestIdentityKey = getOrCreateGuestIdentityKey();
        const summaries = await fetchJoinedEventSummaries({
          userId,
          guestIdentityKey: guestIdentityKey || null,
        });
        setJoinedEvents(summaries);
      } catch (loadError) {
        setJoinedError(
          loadError instanceof Error
            ? loadError.message
            : "Could not load joined events.",
        );
      }

      setIsLoadingJoined(false);
    };

    void run();
  }, [userId]);

  const updateField = (field: keyof EventFormInput, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const title = useMemo(() => {
    if (checkingAuth) {
      return "Checking session...";
    }

    return userId ? "Create and manage your events" : "Sign in to create an event";
  }, [checkingAuth, userId]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!userId) {
      router.push("/login");
      return;
    }

    if (!organizerProfile) {
      setGlobalError("Link your Venmo username before creating an event.");
      return;
    }

    setGlobalError(null);
    const validation = validateEventForm(form);
    setFormErrors(validation.fieldErrors);

    if (Object.keys(validation.fieldErrors).length > 0 || !validation.parsedAmount) {
      return;
    }

    setIsSubmitting(true);

    try {
      const { eventId } = await createEvent({
        eventName: form.eventName,
        amount: validation.parsedAmount,
        organizerUserId: userId,
      });

      router.push(`/event/${eventId}`);
    } catch (submitError) {
      setGlobalError(
        submitError instanceof Error ? submitError.message : "Could not create event.",
      );
      setIsSubmitting(false);
    }
  };

  const handleSaveProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!userId) {
      return;
    }

    setProfileSuccess(null);
    const venmoError = validateVenmoUsername(profileVenmoInput);

    if (venmoError) {
      setProfileError(venmoError);
      return;
    }

    setProfileError(null);
    setIsSavingProfile(true);

    try {
      const profile = await upsertOrganizerProfile({
        userId,
        venmoUsername: profileVenmoInput,
      });
      setOrganizerProfile(profile);
      setProfileVenmoInput(profile.venmo_username);
      setProfileSuccess(
        showEditVenmoModal ? "Venmo username updated." : "Venmo username linked.",
      );
      setShowEditVenmoModal(false);
    } catch (saveError) {
      setProfileError(
        saveError instanceof Error
          ? saveError.message
          : "Could not save Venmo username.",
      );
    }

    setIsSavingProfile(false);
  };

  const openEditVenmoModal = () => {
    if (!organizerProfile) {
      return;
    }

    setProfileError(null);
    setProfileSuccess(null);
    setProfileVenmoInput(organizerProfile.venmo_username);
    setShowEditVenmoModal(true);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    router.refresh();
    router.push("/login");
  };

  const handleDeleteEvent = async (eventId: string) => {
    const shouldDelete = window.confirm(
      "Delete this event? This will also remove all participant records.",
    );

    if (!shouldDelete) {
      return;
    }

    try {
      await deleteEvent(eventId);
      setOrganizerEvents((current) =>
        current.filter((eventSummary) => eventSummary.event.id !== eventId),
      );
      setJoinedEvents((current) =>
        current.filter((eventSummary) => eventSummary.event.id !== eventId),
      );
      setProfileSuccess("Event deleted.");
    } catch (deleteError) {
      setEventsError(
        deleteError instanceof Error
          ? deleteError.message
          : "Could not delete event.",
      );
    }
  };

  const isInitialHomeDataLoading =
    checkingAuth ||
    (Boolean(userId) &&
      isLoadingProfile &&
      isLoadingEvents &&
      isLoadingJoined &&
      organizerEvents.length === 0 &&
      joinedEvents.length === 0 &&
      !eventsError &&
      !joinedError &&
      !profileError);

  if (isInitialHomeDataLoading) {
    return <HomeLoadingScreen />;
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900 sm:px-6 sm:py-12">
      <div className="mx-auto w-full max-w-5xl space-y-5">
        <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-lg sm:p-6">
          <header className="space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Vensoc</p>
            <h1 className="text-2xl font-semibold">{title}</h1>
            <p className="text-sm text-slate-600">
              Organizers create shareable events. Joiners pay in one tap.
            </p>
          </header>

          {!userId && !checkingAuth ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-700">
              <p className="font-medium text-slate-900">Organizer login required</p>
              <p className="mt-2">Create events after logging into Supabase auth.</p>
              <div className="mt-4 flex gap-3">
                <Link
                  href="/login"
                  className="rounded-xl bg-slate-900 px-4 py-2 font-semibold text-white"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="rounded-xl border border-slate-300 px-4 py-2 font-semibold text-slate-700"
                >
                  Sign up
                </Link>
              </div>
            </div>
          ) : (
            <>
              {organizerProfile ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Linked Venmo Account</p>
                      <p className="mt-1 text-sm text-slate-700">
                        {organizerProfile.venmo_username}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                      onClick={openEditVenmoModal}
                    >
                      Edit
                    </button>
                  </div>
                </div>
              ) : (
                <form className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50 p-4" onSubmit={handleSaveProfile}>
                  <p className="text-sm font-semibold text-slate-900">Organizer Venmo Account</p>
                  <p className="text-xs text-amber-800">
                    Verify this is your real Venmo username. Payments will be routed to this account.
                  </p>
                  <div className="flex flex-col gap-3 md:flex-row md:items-end">
                    <label className="block flex-1 text-sm font-medium text-slate-700">
                      Venmo username
                      <input
                        className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-300"
                        value={profileVenmoInput}
                        onChange={(inputEvent) => setProfileVenmoInput(inputEvent.target.value)}
                        placeholder="@yourname"
                      />
                    </label>
                    <button
                      type="submit"
                      className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
                      disabled={isSavingProfile || isLoadingProfile}
                    >
                      {isSavingProfile ? "Saving..." : "Link Venmo"}
                    </button>
                  </div>
                </form>
              )}

              {profileError ? (
                <p className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {profileError}
                </p>
              ) : null}
              {profileSuccess ? (
                <p className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {profileSuccess}
                </p>
              ) : null}

              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Event name
                    <input
                      className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-300"
                      value={form.eventName}
                      onChange={(inputEvent) => updateField("eventName", inputEvent.target.value)}
                      placeholder="Ski Trip Gas"
                    />
                    {formErrors.eventName ? (
                      <span className="mt-2 block text-sm text-red-700">{formErrors.eventName}</span>
                    ) : null}
                  </label>

                  <label className="block text-sm font-medium text-slate-700">
                    Amount per person
                    <input
                      className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-300"
                      value={form.amount}
                      onChange={(inputEvent) => updateField("amount", inputEvent.target.value)}
                      placeholder="25.00"
                      inputMode="decimal"
                    />
                    {formErrors.amount ? (
                      <span className="mt-2 block text-sm text-red-700">{formErrors.amount}</span>
                    ) : null}
                  </label>
                </div>

                {globalError ? (
                  <p className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {globalError}
                  </p>
                ) : null}

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="submit"
                    className="rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-70"
                    disabled={checkingAuth || isSubmitting || !organizerProfile}
                  >
                    {isSubmitting ? "Creating..." : "Create Event"}
                  </button>
                  {userId ? (
                    <button
                      type="button"
                      className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700"
                      onClick={signOut}
                    >
                      Log out
                    </button>
                  ) : null}
                </div>
              </form>
            </>
          )}
        </section>

        {userId ? (
          <section className="min-h-[28rem] space-y-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-lg sm:min-h-[34rem] sm:p-8">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold text-slate-900">Activity Stream</h2>
              <p className="text-sm text-slate-600">
                View events you organized or joined.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  activeTab === "organized"
                    ? "bg-slate-900 text-white"
                    : "border border-slate-300 text-slate-700 hover:bg-slate-100"
                }`}
                onClick={() => setActiveTab("organized")}
              >
                Organized
              </button>
              <button
                type="button"
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  activeTab === "joined"
                    ? "bg-slate-900 text-white"
                    : "border border-slate-300 text-slate-700 hover:bg-slate-100"
                }`}
                onClick={() => setActiveTab("joined")}
              >
                Joined
              </button>
            </div>

            {activeTab === "organized" ? (
              <>
                {eventsError ? (
                  <p className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {eventsError}
                  </p>
                ) : null}
                {isLoadingEvents ? (
                  <p className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
                    Loading organized events...
                  </p>
                ) : (
                  <EventHistoryCards
                    events={organizerEvents}
                    onDeleteEvent={handleDeleteEvent}
                  />
                )}
              </>
            ) : (
              <>
                {joinedError ? (
                  <p className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {joinedError}
                  </p>
                ) : null}
                {isLoadingJoined ? (
                  <p className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
                    Loading joined events...
                  </p>
                ) : (
                  <JoinedEventCards events={joinedEvents} />
                )}
              </>
            )}
          </section>
        ) : null}
      </div>

      {showEditVenmoModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-300 bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-semibold text-slate-900">Edit Venmo Username</h2>
            <p className="mt-2 text-sm text-amber-800">
              Verify this is your real Venmo username before saving.
            </p>
            <form className="mt-4 space-y-4" onSubmit={handleSaveProfile}>
              <label className="block text-sm font-medium text-slate-700">
                Venmo username
                <input
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-300"
                  value={profileVenmoInput}
                  onChange={(inputEvent) => setProfileVenmoInput(inputEvent.target.value)}
                  placeholder="@yourname"
                  autoFocus
                />
              </label>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                  onClick={() => setShowEditVenmoModal(false)}
                  disabled={isSavingProfile}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
                  disabled={isSavingProfile}
                >
                  {isSavingProfile ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </main>
  );
}
