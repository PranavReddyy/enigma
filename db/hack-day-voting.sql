begin;

create table public."HackDayEvent" (
  id text primary key,
  enabled boolean not null default false,
  opens_at timestamptz not null,
  closes_at timestamptz,
  check (closes_at is null or closes_at > opens_at)
);

create table public."HackDayProject" (
  event_id text not null references public."HackDayEvent"(id),
  project_id text not null,
  published boolean not null default false,
  primary key (event_id, project_id)
);

create table public."HackDayVote" (
  event_id text not null,
  voter_key text not null check (voter_key ~ '^[a-f0-9]{64}$'),
  project_id text not null,
  created_at timestamptz not null default now(),
  primary key (event_id, voter_key),
  foreign key (event_id, project_id) references public."HackDayProject"(event_id, project_id)
);

alter table public."HackDayEvent" enable row level security;
alter table public."HackDayProject" enable row level security;
alter table public."HackDayVote" enable row level security;
revoke all on public."HackDayEvent", public."HackDayProject", public."HackDayVote" from public, anon, authenticated;
grant select, insert, update, delete on public."HackDayEvent", public."HackDayProject", public."HackDayVote" to service_role;

create function public.check_hack_day_vote() returns trigger
language plpgsql security invoker set search_path = '' as $$
declare
  ballot public."HackDayEvent"%rowtype;
begin
  select * into ballot from public."HackDayEvent" where id = new.event_id for share;
  if not found or not ballot.enabled or clock_timestamp() < ballot.opens_at
    or (ballot.closes_at is not null and clock_timestamp() >= ballot.closes_at) then
    raise exception 'Voting is closed' using errcode = '23514';
  end if;
  perform 1 from public."HackDayProject" where event_id = new.event_id and project_id = new.project_id and published for share;
  if not found then
    raise exception 'Project is not on the approved ballot' using errcode = '23514';
  end if;
  return new;
end;
$$;
revoke all on function public.check_hack_day_vote() from public, anon, authenticated;
create trigger hack_day_vote_window before insert or update on public."HackDayVote"
for each row execute function public.check_hack_day_vote();

-- Leave disabled until the organiser approves projects and tests email delivery.
insert into public."HackDayEvent" (id, opens_at) values ('hack-day-2026', '2026-10-22 00:00:00+05:30');
commit;
