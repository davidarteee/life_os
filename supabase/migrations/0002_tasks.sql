-- ===========================================================================
-- LifeOS — migration 0002: Tasks (+ the unified Calendar reads from tasks).
-- Reuses the helper functions defined in 0001 (lifeos_create_entity applies the
-- same columns, indexes and owner-only RLS as every other entity).
-- Idempotent: safe to run more than once.
-- ===========================================================================

select lifeos_create_entity('tasks');

create or replace trigger tasks_touch
  before update on public.tasks
  for each row execute function lifeos_touch_updated_at();
