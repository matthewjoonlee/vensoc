drop policy if exists "anyone can join an existing event"
  on public.participants;

create policy "non-organizer can join an existing event"
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
  and (
    participant_user_id is null
    or not exists (
      select 1
      from public.events
      where events.id = participants.event_id
        and events.organizer_user_id = participant_user_id
    )
  )
);
