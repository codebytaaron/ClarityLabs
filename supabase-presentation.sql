create table if not exists public.presentation_state (
  id text primary key,
  slide integer not null default 1,
  prompt_id text,
  question text,
  updated_at timestamptz not null default now(),
  constraint presentation_state_singleton check (id = 'main')
);

insert into public.presentation_state (id, slide)
values ('main', 1)
on conflict (id) do nothing;

create table if not exists public.presentation_responses (
  id bigint generated always as identity primary key,
  prompt_id text not null,
  client_id text not null,
  answer varchar(100) not null,
  created_at timestamptz not null default now(),
  unique (prompt_id, client_id)
);

alter table public.presentation_state enable row level security;
alter table public.presentation_responses enable row level security;

revoke all on public.presentation_state from anon, authenticated;
revoke all on public.presentation_responses from anon, authenticated;
grant select, insert, update, delete on public.presentation_state to service_role;
grant select, insert, update, delete on public.presentation_responses to service_role;
grant usage, select on sequence public.presentation_responses_id_seq to service_role;
