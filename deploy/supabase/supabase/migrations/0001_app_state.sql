create table if not exists public.app_state (
  key text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create or replace function public.touch_app_state_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists app_state_updated_at on public.app_state;

create trigger app_state_updated_at
before update on public.app_state
for each row
execute function public.touch_app_state_updated_at();

alter table public.app_state enable row level security;

drop policy if exists "service role only" on public.app_state;

create policy "service role only"
on public.app_state
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');
