create extension if not exists pgcrypto;

create table if not exists public.events (
  id text primary key,
  name text not null,
  amount numeric(10,2) not null check (amount > 0),
  organizer_venmo_username text not null,
  organizer_user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.participants (
  id uuid primary key default gen_random_uuid(),
  event_id text not null references public.events(id) on delete cascade,
  name text not null,
  status text not null default 'OWES' check (status in ('OWES', 'PAID')),
  joined_at timestamptz not null default timezone('utc', now())
);

create index if not exists participants_event_id_idx on public.participants(event_id);
create index if not exists events_organizer_user_id_idx on public.events(organizer_user_id);

alter table public.events enable row level security;
alter table public.participants enable row level security;

create policy "events are publicly readable"
on public.events
for select
using (true);

create policy "authenticated organizers can create events"
on public.events
for insert
to authenticated
with check (auth.uid() = organizer_user_id);

create policy "organizers can update their events"
on public.events
for update
to authenticated
using (auth.uid() = organizer_user_id)
with check (auth.uid() = organizer_user_id);

create policy "organizers can delete their events"
on public.events
for delete
to authenticated
using (auth.uid() = organizer_user_id);

create policy "participants are publicly readable"
on public.participants
for select
using (true);

create policy "anyone can join an existing event"
on public.participants
for insert
to anon, authenticated
with check (
  status = 'OWES'
  and exists (
    select 1
    from public.events
    where events.id = participants.event_id
  )
);

create policy "event organizer can update participant status"
on public.participants
for update
to authenticated
using (
  exists (
    select 1
    from public.events
    where events.id = participants.event_id
      and events.organizer_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.events
    where events.id = participants.event_id
      and events.organizer_user_id = auth.uid()
  )
);

create policy "event organizer can delete participants"
on public.participants
for delete
to authenticated
using (
  exists (
    select 1
    from public.events
    where events.id = participants.event_id
      and events.organizer_user_id = auth.uid()
  )
);
