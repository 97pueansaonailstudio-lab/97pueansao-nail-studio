-- Run once in this shop's Supabase project > SQL Editor.
-- Rerunnable. Existing gallery tables and local browser records are not modified.
begin;
create table if not exists public.accounting_entries (
  owner_id uuid not null references auth.users(id),
  id text not null check (char_length(id) between 1 and 99),
  date date not null check (date between date '1900-01-01' and date '9999-12-31'),
  customer integer not null check (customer between 1 and 999),
  service text not null check (char_length(service) between 1 and 100),
  cents integer not null check (cents between 0 and 999999900),
  note text not null default '' check (char_length(note) <= 200),
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (owner_id, id)
);
alter table public.accounting_entries enable row level security;
revoke all on public.accounting_entries from anon, authenticated;
grant select, insert, update, delete on public.accounting_entries to authenticated;
drop policy if exists accounting_owner_select on public.accounting_entries;
drop policy if exists accounting_owner_insert on public.accounting_entries;
drop policy if exists accounting_owner_update on public.accounting_entries;
drop policy if exists accounting_owner_delete on public.accounting_entries;
create policy accounting_owner_select on public.accounting_entries for select to authenticated
  using ((select auth.uid()) = owner_id);
create policy accounting_owner_insert on public.accounting_entries for insert to authenticated
  with check ((select auth.uid()) = owner_id);
create policy accounting_owner_update on public.accounting_entries for update to authenticated
  using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy accounting_owner_delete on public.accounting_entries for delete to authenticated
  using ((select auth.uid()) = owner_id);
create or replace function public.accounting_entry_version()
returns trigger language plpgsql set search_path = '' as $$
begin
  if TG_OP = 'INSERT' then
    NEW.version := 1;
    NEW.created_at := now();
  else
    NEW.version := OLD.version + 1;
    NEW.created_at := OLD.created_at;
    if NEW.owner_id <> OLD.owner_id or NEW.id <> OLD.id then
      raise exception 'Entry identity cannot change';
    end if;
  end if;
  NEW.updated_at := now();
  return NEW;
end;
$$;
revoke all on function public.accounting_entry_version() from public;
drop trigger if exists accounting_entry_version on public.accounting_entries;
create trigger accounting_entry_version before insert or update on public.accounting_entries
  for each row execute function public.accounting_entry_version();
create index if not exists accounting_entries_owner_date on public.accounting_entries(owner_id, date);
commit;
