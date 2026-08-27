-- ===========================================================================
-- LifeOS — migration 0003: Nutrition + Exercise.
-- Reuses the 0001 helpers (same owner-only RLS as every other entity).
-- Idempotent: safe to run more than once.
-- ===========================================================================

select lifeos_create_entity('foods');
select lifeos_create_entity('food_entries');
select lifeos_create_entity('workouts');

create or replace trigger foods_touch
  before update on public.foods
  for each row execute function lifeos_touch_updated_at();

create or replace trigger food_entries_touch
  before update on public.food_entries
  for each row execute function lifeos_touch_updated_at();

create or replace trigger workouts_touch
  before update on public.workouts
  for each row execute function lifeos_touch_updated_at();
