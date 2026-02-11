create table if not exists public.organizer_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  venmo_username text not null,
  venmo_username_normalized text generated always as (
    lower(regexp_replace(venmo_username, '^@+', ''))
  ) stored,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint organizer_profiles_venmo_not_empty
    check (length(trim(venmo_username)) > 0),
  constraint organizer_profiles_venmo_format
    check (venmo_username ~* '^@?[A-Za-z0-9_-]{3,30}$')
);

create unique index if not exists organizer_profiles_venmo_username_norm_uniq
  on public.organizer_profiles (venmo_username_normalized);

alter table public.organizer_profiles enable row level security;

drop policy if exists "profiles owner select" on public.organizer_profiles;
create policy "profiles owner select"
on public.organizer_profiles
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "profiles owner insert" on public.organizer_profiles;
create policy "profiles owner insert"
on public.organizer_profiles
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "profiles owner update" on public.organizer_profiles;
create policy "profiles owner update"
on public.organizer_profiles
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create or replace function public.enforce_event_organizer_venmo()
returns trigger
language plpgsql
security definer
as $$
declare profile_venmo text;
begin
  select venmo_username
  into profile_venmo
  from public.organizer_profiles
  where user_id = new.organizer_user_id;

  if profile_venmo is null then
    raise exception 'Organizer must link Venmo username before creating events';
  end if;

  new.organizer_venmo_username := lower(regexp_replace(profile_venmo, '^@+', ''));
  return new;
end;
$$;

drop trigger if exists events_enforce_organizer_venmo on public.events;
create trigger events_enforce_organizer_venmo
before insert on public.events
for each row execute function public.enforce_event_organizer_venmo();
