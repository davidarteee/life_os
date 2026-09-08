-- ===========================================================================
-- LifeOS — migration 0004: Events.
-- Reuses the 0001 helpers (same owner-only RLS as every other entity).
-- Idempotent: safe to run more than once.
-- ===========================================================================

select lifeos_create_entity('events');

create or replace trigger events_touch
  before update on public.events
  for each row execute function lifeos_touch_updated_at();
