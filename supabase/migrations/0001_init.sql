-- ===========================================================================
-- LifeOS — initial schema + Row Level Security
-- ===========================================================================
-- Storage model: one table per entity, each with a small set of indexed
-- columns (id, user_id, timestamps, deleted) plus a `data` jsonb column holding
-- the full offline record. This keeps the client record shape identical on both
-- sides, makes RLS uniform (user_id = auth.uid()), and makes offline sync a
-- last-write-wins upsert on updated_at. See docs/ARCHITECTURE.md for the
-- rationale and the future-normalization path.
--
-- Every table:
--   * has user_id referencing auth.users, with an index,
--   * enables RLS,
--   * grants each user access to ONLY their own rows.
-- ===========================================================================

-- Helper: apply the identical owner-scoped policy set to a table. -------------
-- Idempotent: drops each policy first so the migration is safe to re-run.
create or replace function lifeos_apply_rls(tbl regclass) returns void as $$
declare t text := tbl::text;
begin
  execute format('alter table %s enable row level security;', t);
  execute format('drop policy if exists "select_own" on %s;', t);
  execute format('create policy "select_own" on %s for select using (auth.uid() = user_id);', t);
  execute format('drop policy if exists "insert_own" on %s;', t);
  execute format('create policy "insert_own" on %s for insert with check (auth.uid() = user_id);', t);
  execute format('drop policy if exists "update_own" on %s;', t);
  execute format('create policy "update_own" on %s for update using (auth.uid() = user_id) with check (auth.uid() = user_id);', t);
  execute format('drop policy if exists "delete_own" on %s;', t);
  execute format('create policy "delete_own" on %s for delete using (auth.uid() = user_id);', t);
end;
$$ language plpgsql;

-- Shared column set via a template. ------------------------------------------
create or replace function lifeos_create_entity(tbl text) returns void as $$
begin
  execute format($f$
    create table if not exists public.%I (
      id          uuid primary key,
      user_id     uuid not null references auth.users(id) on delete cascade,
      created_at  timestamptz not null default now(),
      updated_at  timestamptz not null default now(),
      deleted     boolean not null default false,
      data        jsonb not null
    );
  $f$, tbl);
  execute format('create index if not exists %I on public.%I (user_id);', tbl || '_user_idx', tbl);
  execute format('create index if not exists %I on public.%I (user_id, updated_at);', tbl || '_user_updated_idx', tbl);
  perform lifeos_apply_rls(format('public.%I', tbl)::regclass);
end;
$$ language plpgsql;

-- Entities (names match the sync engine's REGISTRY). --------------------------
select lifeos_create_entity('habits');
select lifeos_create_entity('habit_logs');
select lifeos_create_entity('game_state');
select lifeos_create_entity('xp_events');
select lifeos_create_entity('free_days');
select lifeos_create_entity('shop_purchases');
select lifeos_create_entity('user_achievements');
select lifeos_create_entity('challenges');
select lifeos_create_entity('user_settings');

-- Keep updated_at fresh on every write (defense in depth; the client also sets it).
create or replace function lifeos_touch_updated_at() returns trigger as $$
begin
  new.updated_at := greatest(new.updated_at, now());
  return new;
end;
$$ language plpgsql;

do $$
declare t text;
begin
  foreach t in array array[
    'habits','habit_logs','game_state','xp_events','free_days',
    'shop_purchases','user_achievements','challenges','user_settings'
  ] loop
    execute format(
      'create or replace trigger %I before update on public.%I for each row execute function lifeos_touch_updated_at();',
      t || '_touch', t
    );
  end loop;
end $$;

-- ===========================================================================
-- Storage (for future large binaries: challenge evidence, progress photos).
-- Kept private; policies scope objects to a per-user folder.
-- ===========================================================================
insert into storage.buckets (id, name, public)
values ('lifeos', 'lifeos', false)
on conflict (id) do nothing;

drop policy if exists "lifeos_read_own" on storage.objects;
create policy "lifeos_read_own" on storage.objects for select
  using (bucket_id = 'lifeos' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "lifeos_write_own" on storage.objects;
create policy "lifeos_write_own" on storage.objects for insert
  with check (bucket_id = 'lifeos' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "lifeos_update_own" on storage.objects;
create policy "lifeos_update_own" on storage.objects for update
  using (bucket_id = 'lifeos' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "lifeos_delete_own" on storage.objects;
create policy "lifeos_delete_own" on storage.objects for delete
  using (bucket_id = 'lifeos' and (storage.foldername(name))[1] = auth.uid()::text);
