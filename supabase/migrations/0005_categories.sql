-- ===========================================================================
-- LifeOS — migration 0005: shared Categories (tasks + events).
-- Reuses the 0001 helpers (same owner-only RLS as every other entity).
-- Idempotent: safe to run more than once.
-- ===========================================================================

select lifeos_create_entity('categories');

create or replace trigger categories_touch
  before update on public.categories
  for each row execute function lifeos_touch_updated_at();
