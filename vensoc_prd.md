Below is a ready-to-use PRD text file that you can save directly into your project directory (e.g., VENSOC_PRD.md). It follows recommended PRD structure and covers all features, acceptance criteria, flows, and task breakdowns for use with an AI code assistant like Codex. PRDs typically include detailed user stories, use cases, UI behavior, and acceptance criteria to align engineering with product intent, which this document reflects. ￼

⸻


# Vensoc POC — Product Requirements Document (Engineering)

## Document Version
v1.8  
Date: 2026-02-11

### Version Notes
- v1.1: Updated scope to include organizer authentication via Supabase Auth, added backfilled implementation status, and added deferred OAuth branding tasks (custom auth domain and Google consent logo).
- v1.2: Removed car emoji from share message template and added organizer homepage event-history cards with quick message actions as a new feature.
- v1.3: Aligned Venmo note rule with implementation (`{eventName}-via.Vensoc`) and marked Feature 7 as implemented in code pending live verification.
- v1.4: Added optional participant sign-in to save activity, homepage tabs for organized vs joined events, and credit-score data requirements (including time-to-payment tracking).
- v1.5: Backfilled implementation progress for Feature 8 core UX and partial Feature 9 data instrumentation; added migration-driven telemetry foundation status.
- v1.6: Refined Feature 8 join UX: auth choice appears before name entry for signed-out users, and logged-in users get name autofill in join modal.
- v1.7: Added organizer-level Venmo profile requirement with correctness warning; event creation is blocked until account-linked Venmo username is configured.
- v1.8: Added organizer event deletion and mobile-first UX optimization requirements.

---

# 1. Overview

Vensoc is a web tool that enables a group organizer to collect payments via Venmo by creating a shared event. Participants join and pay in a streamlined flow. The organizer tracks who has paid and shares status with group chats.

Purpose:  
*Enable social payment coordination and reduce manual Venmo follow-ups.*

---

# 2. Scope & Definitions

## 2.1 Purpose
This PRD defines the features and behaviors necessary to complete a POC for Vensoc, including participant join flow, Venmo link deep linking, organizer verification, and group status sharing.

## 2.2 Auth Scope
- Organizer authentication is in scope via Supabase Auth (Email + Google OAuth).
- Participant authentication is optional. Joiners can still participate with name-only flow, but can be prompted to sign in to persist activity history.

---

# 3. Actors

- **Organizer**: Creates event and verifies payments.
- **Participant**: Joins event and pays via Venmo.
- **System**: Renders UI, builds Venmo links, persists state.

---

# 4. Data Model

### Event

eventId: string
eventName: string
amount: number
organizerVenmoUsername: string
participants: Participant[]
createdAt: timestamp

### Participant

participantId: string
name: string
status: “OWES” | “PAID”
joinedAt: timestamp

### Additional Data for Activity + Reliability Scoring

- participantUserId (nullable uuid): links a participant row to authenticated user identity
- joinedEvents: events the signed-in user joined
- paymentInitiatedAt (nullable timestamp): when participant tapped pay
- markedPaidAt (nullable timestamp): when organizer marked participant as paid
- paymentLatencyMinutes (derived): time between joinedAt and markedPaidAt
- reminderCount (number): count of follow-up reminders sent
- noShowFlag (boolean): participant joined but never completed payment by close/manual cutoff
- onTimePaymentRate (derived): percentage of payments completed within target window
- completionRate (derived): percentage of joined events that reached PAID
- organizerTrustSignals (future): disputes/overrides/manual corrections

---

# 5. User Stories & Features

---

## FEATURE 1 — Event Creation

**User Story**  
As an organizer, I want to create a payment event by entering the event name, amount, and my Venmo username so that I can share this with my group.

**Requirements**
- Input: Event name (string), Amount (decimal), Organizer Venmo username
- Normalize Venmo username (strip '@')
- Validate all fields (non-empty, valid number)
- Persist event data for later retrieval
- Generate `eventId`
- Redirect to event page after creation
- Organizer must link Venmo username to profile before creating events
- Show warning to verify linked Venmo belongs to organizer

**Acceptance**
- Invalid inputs show errors
- Event persists after page refresh
- Create event action is disabled or rejected when organizer has no linked Venmo profile

**Tasks**
- Build form
- Validate fields
- Normalize Venmo username
- Save event
- Redirect

---

## FEATURE 2 — Event Page Rendering

**User Story**  
As a visitor, I want to view event details so I know what I’m joining.

**Must Show**
- Event name
- Amount
- Organizer Venmo username
- CTA

**Acceptance**
- Data loads fast on page open
- Missing event shows friendly error

**Tasks**
- Fetch event
- Render fields
- Handle missing or malformed eventId

---

## FEATURE 3 — Participant Join & Pay

**User Story**  
As a participant, I can provide my name and pay in one tap.

**Behavior**
- On CTA click, prompt for name
- Validate non-empty
- Append participant as `{ name, status: OWES }`
- Persist event update
- Generate Venmo deep link
- Redirect to Venmo

**Venmo Link Format**

https://venmo.com/{organizer}?txn=pay&amount={amount}&note={note}

**Note Rules**
- Use note format `{eventName}-via.Vensoc` (no spaces)
- URL encode

**Acceptance**
- Name saves
- Venmo opens prefilled
- Returning to event shows participant

**Tasks**
- Name modal
- Input validation
- Create participant
- Persist event
- Venmo link builder
- Redirect logic

---

## FEATURE 4 — Organizer Participant Dashboard

**User Story**  
As the organizer, I want to view all participants and mark them as paid manually so I can track payment status.

**UI**
- List of participants
- Status badges
- Checkbox toggle (OWES ↔ PAID)

**Acceptance**
- Toggle persists
- Refresh preserves status
- Only organizer sees toggles

**Tasks**
- Participant list UI
- Toggle logic
- Persist update
- Sync UI

---

## FEATURE 5 — Share Payment Status to Group Chat

**User Story**  
As the organizer, I want to share who has paid and who hasn’t with the group so others know current status.

**Message Template**

{Event Name} (${amount} each)

✅ Paid: {list}
⏳ Owes: {list}

Pay here: {venmoDeepLink}

**Acceptance**
- Format reflects state
- Button copies message
- Clipboard API used
- User can paste to any chat

**Tasks**
- Create status formatter
- Copy to clipboard
- Show confirmation UI

---

## FEATURE 6 — Completion State

**User Story**  
As the organizer, when all have paid, I see a “complete” message.

**Condition**

participants.length > 0 && all status === PAID

**Acceptance**
- Celebration UI appears

**Tasks**
- Render completion
- Track state

---

## FEATURE 7 — Organizer Homepage Event History

**User Story**  
As an organizer, I want to see cards for events I already created and quickly copy/share payment messages so I can manage active and past collections from one place.

**Requirements**
- Homepage shows organizer-owned event cards after login
- Each card shows event name, amount, created date, and paid/owes counts
- Each card links to event detail page
- Each card has action to copy share message (same format as event page)
- Organizer can still create a new event from homepage

**Acceptance**
- Organizer sees their past events on refresh
- Cards are ordered with newest first
- Copy action on card includes current participant status and Venmo deep link
- Joiners (no login) do not access organizer homepage cards

**Tasks**
- Query organizer events list
- Build event card list UI
- Add per-card share-message action
- Add navigation to event detail
- Keep create-event CTA on homepage

---

## FEATURE 8 — Participant Activity Saving + Homepage Tabs

**User Story**  
As a user, I want to sign in to save my payment activity and view both events I organize and events I join from one homepage.

**Requirements**
- Prompt joiners to sign in (non-blocking) so activity can be saved to account history
- For signed-out users, show `Sign in / Continue as guest` before name input on `Join and Pay`
- For signed-in users, prefill participant name in join modal from account metadata/email
- Homepage has two tabs for signed-in users:
- `Organized` tab: events where user is organizer
- `Joined` tab: events where user is a participant
- Name-only join remains supported for guest users
- If signed in during join flow, link participant row to `participantUserId`

**Acceptance**
- Signed-in users can switch between `Organized` and `Joined` tabs
- `Joined` tab persists across refresh and shows joined events
- Guest join still works without auth
- Upgrading from guest to signed-in links future activity automatically

**Tasks**
- Add participant auth prompt UI in join flow
- Extend participants schema with optional `participant_user_id`
- Query and render organized vs joined tabs on homepage
- Build joined-events card list UI
- Ensure RLS supports participant-owned joined-event reads

---

## FEATURE 9 — Reliability/Credit Score Data Foundation

**User Story**  
As a platform, I want to capture reliable payment behavior signals so I can later compute user reliability/credit-style scores.

**Requirements**
- Track timestamps for join, pay intent, and marked-paid events
- Store reminder/dispute markers for risk scoring inputs
- Define derived metrics (payment latency, completion rate, on-time rate)
- Provide transparent score-input data model (even if score formula is deferred)
- Include consent/disclosure language for behavior tracking

**Acceptance**
- Each participant record has enough fields to compute time-to-payment
- Metrics can be computed per user across events
- Data model supports both organizer and joiner perspectives
- No score shown to users yet unless explicitly enabled in future scope

**Tasks**
- Add schema fields for behavior telemetry
- Add event logging points in join/pay/status-toggle flows
- Create metric computation utility module
- Add admin/internal reporting view or query helpers
- Document privacy + consent requirements in product copy

---

## FEATURE 10 — Organizer Event Deletion

**User Story**  
As an organizer, I want to delete events I created so I can clean up canceled or obsolete collections.

**Requirements**
- Organizer-only delete action on event detail page
- Organizer-only delete action on homepage organized-event cards
- Confirmation step before delete
- Deleting event also removes associated participants/activity records

**Acceptance**
- Non-organizers cannot delete events
- Deleting an event removes it from homepage lists
- Event detail page redirects to homepage after successful delete

**Tasks**
- Add event delete service call
- Add organizer delete controls in UI
- Add confirmation prompts and success/error feedback
- Ensure RLS/DB permissions enforce organizer-only delete

---

## FEATURE 11 — Mobile-First UX Optimization

**User Story**  
As a mobile user, I want the app to be easy to use one-handed with readable spacing and tap targets.

**Requirements**
- Prioritize mobile layout defaults before desktop enhancements
- Optimize spacing, typography, and tap-target sizes for phones
- Ensure action buttons stack/full-width on narrow screens
- Keep key workflows usable without horizontal scroll

**Acceptance**
- Homepage, auth pages, and event pages are comfortable on common phone sizes
- Card actions and modal actions are accessible and easy to tap
- No critical controls are clipped on mobile

**Tasks**
- Refine responsive spacing and card layouts
- Convert key action groups to mobile-friendly stacked layouts
- Validate major flows on mobile viewport sizes

---

# 6. Non-Goals

- No Venmo API integrations
- No mandatory participant login requirement
- No auto payment verification
- No push notifications

---

# 7. Implementation Status (Backfilled)

- [x] FEATURE 1 — Event Creation implemented in app code.
- [x] FEATURE 2 — Event Page Rendering implemented in app code.
- [x] FEATURE 3 — Participant Join & Pay implemented in app code.
- [x] FEATURE 4 — Organizer Participant Dashboard implemented in app code.
- [x] FEATURE 5 — Share Payment Status to Group Chat implemented in app code.
- [x] FEATURE 6 — Completion State implemented in app code.
- [~] FEATURE 7 — Organizer Homepage Event History implemented in code and pending live Supabase verification.
- [~] FEATURE 8 — Participant Activity Saving + Homepage Tabs implemented in code and pending live Supabase verification.
- [~] FEATURE 9 — Reliability/Credit Score Data Foundation partially implemented (schema + key timestamps), full instrumentation pending.
- [~] Organizer Venmo profile linking requirement implemented in code and pending live Supabase verification.
- [~] FEATURE 10 — Organizer Event Deletion implemented in code and pending live Supabase verification.
- [~] FEATURE 11 — Mobile-First UX Optimization implemented in code and pending cross-device verification.
- [~] Live Supabase verification in progress (provider setup and manual end-to-end checks).

---

# 8. Acceptance Criteria Summary

All features above are implemented and stable, UI flows work end-to-end, state persists on refresh, and status sharing works.

---

# 9. Future Considerations

These are not required for the POC:
- Backend service
- Automatic payment detection
- Payment splits
- Custom Supabase auth domain for cleaner Google OAuth surface text (replace `*.supabase.co` branding)
- Google OAuth consent screen logo and final brand polish (`Vensoc` app identity)

---


⸻

Usage Notes

✅ Save this as a markdown file (e.g., VENSOC_PRD.md) in your project root.
✅ Codex can open and reference this doc when generating code.

A good PRD like this balances clarity with actionable technical requirements so engineers and AI assistants behave predictably and reliably. ￼

⸻

If you want, I can also generate:
	•	A folder structure scaffold
	•	Starter React/JS code templates for each feature
	•	Individual Codex prompts ready for copy-paste

Just tell me what you want next.
