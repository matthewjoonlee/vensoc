alter table public.events
add column if not exists due_at timestamptz null,
add column if not exists closed_at timestamptz null;

alter table public.participants
add column if not exists participant_user_id uuid null references auth.users(id) on delete set null,
add column if not exists guest_identity_key text null,
add column if not exists payment_initiated_at timestamptz null,
add column if not exists marked_paid_at timestamptz null,
add column if not exists reminder_count integer not null default 0,
add column if not exists no_show_flag boolean not null default false,
add column if not exists status_changed_by_user_id uuid null references auth.users(id) on delete set null,
add column if not exists status_change_reason text null,
add column if not exists paid_amount numeric(10,2) null check (paid_amount is null or paid_amount >= 0),
add column if not exists currency text not null default 'USD',
add column if not exists dispute_flag boolean not null default false,
add column if not exists dispute_note text null;

alter table public.participants
  drop constraint if exists participants_reminder_count_check;

alter table public.participants
  add constraint participants_reminder_count_check
  check (reminder_count >= 0);

create index if not exists participants_participant_user_id_idx
  on public.participants(participant_user_id);

create index if not exists participants_guest_identity_key_idx
  on public.participants(guest_identity_key);

create index if not exists participants_event_user_idx
  on public.participants(event_id, participant_user_id);

create table if not exists public.participant_activity_logs (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.participants(id) on delete cascade,
  event_id text not null references public.events(id) on delete cascade,
  actor_user_id uuid null references auth.users(id) on delete set null,
  activity_type text not null,
  activity_at timestamptz not null default timezone('utc', now()),
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists participant_activity_logs_participant_id_idx
  on public.participant_activity_logs(participant_id);

create index if not exists participant_activity_logs_event_id_idx
  on public.participant_activity_logs(event_id);

create index if not exists participant_activity_logs_actor_user_id_idx
  on public.participant_activity_logs(actor_user_id);

create index if not exists participant_activity_logs_activity_type_idx
  on public.participant_activity_logs(activity_type);

create index if not exists participant_activity_logs_activity_at_idx
  on public.participant_activity_logs(activity_at);

alter table public.participant_activity_logs enable row level security;

drop policy if exists "participant activity logs readable by organizer or participant owner"
  on public.participant_activity_logs;

create policy "participant activity logs readable by organizer or participant owner"
on public.participant_activity_logs
for select
to authenticated
using (
  exists (
    select 1
    from public.events
    where events.id = participant_activity_logs.event_id
      and events.organizer_user_id = auth.uid()
  )
  or exists (
    select 1
    from public.participants
    where participants.id = participant_activity_logs.participant_id
      and participants.participant_user_id = auth.uid()
  )
);

drop policy if exists "participant activity logs insert for authenticated actors"
  on public.participant_activity_logs;

create policy "participant activity logs insert for authenticated actors"
on public.participant_activity_logs
for insert
to authenticated
with check (
  actor_user_id is null
  or actor_user_id = auth.uid()
);

create or replace view public.user_reliability_metrics as
select
  participant_user_id as user_id,
  count(*) as total_joined_events,
  count(*) filter (where status = 'PAID') as total_paid_events,
  round(
    case
      when count(*) = 0 then 0
      else (count(*) filter (where status = 'PAID')::numeric / count(*)::numeric) * 100
    end,
    2
  ) as completion_rate_percent,
  round(
    avg(
      case
        when marked_paid_at is not null then extract(epoch from (marked_paid_at - joined_at)) / 60
        else null
      end
    )::numeric,
    2
  ) as avg_payment_latency_minutes,
  count(*) filter (
    where marked_paid_at is not null
      and (marked_paid_at - joined_at) <= interval '24 hours'
  ) as on_time_payment_count,
  round(
    case
      when count(*) filter (where marked_paid_at is not null) = 0 then 0
      else (
        count(*) filter (
          where marked_paid_at is not null
            and (marked_paid_at - joined_at) <= interval '24 hours'
        )::numeric
        /
        count(*) filter (where marked_paid_at is not null)::numeric
      ) * 100
    end,
    2
  ) as on_time_payment_rate_percent
from public.participants
where participant_user_id is not null
group by participant_user_id;
