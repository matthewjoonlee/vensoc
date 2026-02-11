# Vensoc Development Progress Tracker

Last Updated: 2026-02-11

---

## Current Active Feature
FEATURE 8/9 Planning — Activity Saving, Homepage Tabs, Reliability Data

---

## In Progress Tasks
- [~] Complete Supabase dashboard setup required for local app operation.
- [~] Verify database migration (`supabase/migrations/001_vensoc_schema.sql`) has been executed successfully.
- [~] Verify Auth URL config (redirects) and provider settings (Email + Google).
- [ ] Run manual organizer and joiner flow checks against live Supabase data.
- [x] Plan FEATURE 7 (Organizer homepage event-history cards and quick share actions).
- [x] Implement organizer-owned event query with participant counts and newest-first ordering.
- [x] Build homepage event card list UI and per-card share-message copy action.
- [~] Verify Feature 7 acceptance criteria and update completion states in PRD + progress.
- [x] Plan FEATURE 8 (participant sign-in prompt + Organized/Joined homepage tabs).
- [x] Plan FEATURE 9 (reliability/credit-score data capture and derived metrics).
- [x] Define schema migration tasks for participant identity linking and payment timing telemetry.
- [x] Define implementation tasks for homepage `Joined` tab queries and UI cards.
- [~] Define instrumentation tasks for time-to-payment and reminder/dispute tracking.
- [~] Implement FEATURE 8 core flow (post-join sign-in prompt + homepage Organized/Joined tabs).
- [~] Implement FEATURE 9 schema/data hooks (telemetry columns + partial timestamp instrumentation).
- [~] Implement organizer Venmo profile linking gate for event creation (warning + DB enforcement).
- [x] Prevent organizers from joining their own events (UI + RLS).
- [~] Add organizer event deletion flow (homepage cards + event detail page).
- [~] Apply mobile-first layout and spacing refinements across major screens.

---

## Blocked Tasks
None

---

## Completed Tasks
- [x] Implemented organizer event creation flow with validation and Venmo username normalization.
- [x] Implemented event details page and friendly missing-event handling.
- [x] Implemented participant name capture + Venmo deep-link redirect flow.
- [x] Implemented organizer-only participant status toggles with persistence.
- [x] Implemented share-to-group status message formatter + clipboard button.
- [x] Implemented completion state banner when all participants are paid.
- [x] Added Supabase schema migration with RLS policies for events and participants.
- [x] Added automated utility tests for validation, Venmo URL generation, and share-message formatting.
- [x] Implemented organizer homepage event-history cards with newest-first ordering, paid/owes counts, event links, and per-card copy-message actions.
- [x] Added migration `002_activity_and_reliability_foundation.sql` for participant identity linking, payment-timing telemetry, reliability signals, and activity-log foundation.
- [x] Added safe `next` redirect handling in login/signup for auth-gated return flows.
- [x] Added guest identity utility for linking guest activity across sessions.
- [x] Added joined-event query service and joined-events card UI for homepage tabs.
- [x] Added migration `003_organizer_venmo_profile.sql` with organizer profile table, RLS, and DB trigger enforcing profile-linked Venmo on event creation.
- [x] Updated homepage create flow to require linked Venmo profile and show correctness warning before event creation.
- [x] Updated event page UX to hide/disable join flow for organizers and show explanatory message.
- [x] Added migration `004_prevent_organizer_self_join.sql` to enforce organizer self-join prevention at RLS layer.
- [x] Added organizer event deletion controls on homepage cards and event detail page.
- [x] Added `deleteEvent` service and wired organizer-only delete confirmations.
- [x] Applied mobile-first responsive refinements to homepage, event page, auth pages, and action-heavy card/modal components.
- [x] Added paid-state guard so users who already joined and paid cannot re-enter join-and-pay flow.

---

## Technical Debt
- E2E coverage for full organizer/joiner flows is still missing (only utility tests are automated).
- OAuth branding polish is deferred until custom auth domain is enabled.
- Activity logging table exists but app-side event inserts for reminder/dispute lifecycle are not fully wired yet.

---

## Known Bugs
- List bugs discovered

---

## Refactor Backlog
- Add custom Supabase auth domain when budget allows.
- Add Google OAuth consent logo and finalized brand metadata.
- Add integration/E2E tests for auth + event lifecycle.
- Build organizer homepage event-history cards with per-event quick share action.
- Implement FEATURE 8 (participant activity save prompt and two-tab homepage).
- Implement FEATURE 9 (reliability/credit scoring data foundation).

---

## Notes for Next Session
- Product decisions confirmed:
- Supabase Auth is in scope for organizer flow.
- Joiners remain anonymous (name-only, no login).
- Backfill progress/completion in docs.
- Immediate focus is Supabase setup verification before additional feature work.
- Login and signup UI include Google OAuth button.
- Apple OAuth intentionally deferred for now.
- PRD v1.2 adds FEATURE 7 (organizer event-history homepage cards).
- Share message template in PRD no longer uses the car emoji prefix.
- PRD v1.4 adds FEATURE 8 (Organized/Joined tabs + sign-in prompt) and FEATURE 9 (reliability data model for future credit scores).
- Feature 8 core UI/flow implemented in code and needs live Supabase verification.
- Feature 9 is partially implemented (schema + key timestamps) and still needs full activity-log instrumentation and reporting helpers.
- PRD v1.6 refines Feature 8 join UX: pre-name auth choice for signed-out users and logged-in name autofill.
- PRD v1.7 adds organizer-linked Venmo profile requirement before event creation.
- Organizer self-join prevention implemented in UI and DB (migration `004` applied).
- PRD v1.8 adds FEATURE 10 (event deletion) and FEATURE 11 (mobile-first optimization).
