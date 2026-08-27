# LifeOS — Next Steps

## Immediate next module: **Nutrition + Exercise** (in progress)
Full spec: `MODULE_SPECIFICATIONS.md` → "Nutrition + Exercise". A **data‑layer scaffold already exists** on branch `wip/nutrition-exercise` (does not build). Two ways to proceed:
- **Option A (recommended):** rebuild fresh on `main` following the documented plan (the scaffold is a reference). It's mostly mechanical.
- **Option B:** cherry‑pick / review the WIP branch files, then finish. Only do this if you re‑verify each file.

### What the WIP scaffold already contains (reference)
Types (`Food`, `FoodEntry`, `Workout`, `Macros`, `NutritionConfig` on `UserSettings.nutrition`), Dexie **v3** tables (`foods`, `foodEntries`, `workouts`) + sync REGISTRY entries, `supabase/migrations/0003_nutrition.sql`, services `src/lib/data/{foods,nutrition,workouts}.ts`, pure math `src/lib/nutrition/{macros,energy}.ts`, built‑in catalog `src/lib/nutrition/foods-catalog.ts`, defaults `src/lib/nutrition/config.ts`, and partial gamification wiring (nutrition + task achievements, `nutrition.target` XP reason).

### What's left to build for Nutrition + Exercise
1. Finish gamification wiring: add `nutritionDaysLogged` + `nutritionTargetsHit` to `computeCounters()` in `src/lib/data/game.ts`; add `reconcileNutrition(userId, day, config)` to `src/lib/data/actions.ts` (award/reverse `nutritionTarget` XP on targets met, then `recomputeAchievements`); update the `engine.test.ts` counters fixture.
2. Hooks: `src/hooks/use-nutrition.ts` (day meals + totals + targets + progress + energy balance), `src/hooks/use-workouts.ts`.
3. UI: meal blocks (5), food picker (catalog + user foods + recent, quantity → live macros), food form (create/edit user food), macro progress chart (Recharts or SVG rings), day summary, energy‑balance card; workout form + list. Pages `/nutrition` and `/workouts` (replace placeholders); mark them `ready: true` in `src/components/layout/nav-config.ts`.
4. Settings: nutrition targets + energy mode/factor editor.
5. Dashboard: nutrition summary widget + exercise summary widget; register in `src/lib/dashboard/widgets.ts` + `widget-registry.tsx` + i18n.
6. i18n es/en/ca for all nutrition/exercise strings.
7. Tests (fake‑indexeddb): macro math, day totals, targets‑met, energy balance, workouts, **idempotency + per‑user isolation**.
8. **Research + document** the real Strava (official OAuth) and Suunto (Strava‑as‑hub / file import) integration paths in the module.
9. Verify: `tsc`, `eslint`, `vitest`, `build`; browser smoke test in local mode; confirm no sync duplicates.
10. **User action:** run `supabase/migrations/0003_nutrition.sql` in the Supabase SQL editor before testing cloud sync.

## Recommended development order after Nutrition + Exercise
1. **General UI/UX polish pass** (mobile especially) — the user deferred this; do it as one phase once a few more modules exist.
2. **Goals (5‑year + 6‑month vision)** — high user value, mostly self‑contained (needs Storage for photos).
3. **Study + Pomodoro** — depends on Calendar (exams/assignments) + Tasks (spawn tasks); Pomodoro widget already exists.
4. **Projects** — light; optional Task association.
5. **Notes** — self‑contained (Storage for images).
6. **Sleep** — light; links to the sleep habit.
7. **Investments** — needs a market‑data provider abstraction; manual + CSV first.
8. **Books / Movies / Wishlist / Travel / Contacts** — light CRUD modules; batch them.
9. **Music (Spotify)** — official OAuth integration.
10. **AI assistant** — read‑only analysis over all modules; do after several modules exist so there's data to analyze.
11. **Databases** (Notion‑style views) — do late; it reads every module's tables.

## Dependencies (build order constraints)
- Calendar providers: Study/Contacts/etc. plug into `collectCalendarItems`.
- Learning depends on the AI assistant for plans.
- Databases + AI assistant depend on many modules existing first.
- Everything depends on Gamification for XP (already built).

## Decisions still to make
- Nutrition: exact macro chart style (rings vs bars) — pick one, keep it consistent with the dashboard.
- Whether nutrition XP also rewards logging vs only hitting targets (current plan: only targets, to avoid duplicating the "register nutrition" habit).
- Storage strategy for large binaries (goal/progress photos, note images): currently base64 in records for small evidence images; **move to Supabase Storage** before adding photo‑heavy modules (Goals, Notes, Body tracking).
- Market‑data provider choice for Investments.
- AI provider + budget/limits.

## Known problems / technical risks
- **Base64 images in synced records** don't scale — migrate to Supabase Storage before photo modules. (Challenge evidence currently downscales to keep size sane.)
- **Dexie schema migrations**: every new table = a new `this.version(n).stores({...})` bump in `src/lib/db/dexie.ts` + a new `000X_*.sql` migration + a sync REGISTRY entry. Forgetting any one breaks sync silently.
- **New Supabase table not created** → its sync push fails silently (app still works locally). Always ship the migration and tell the user to run it.
- **PWA service worker** only registers in production; if it ever caches stale chunks, clear site data / it self‑unregisters in dev.
- **Raster PWA icons** missing (SVG only) — some browsers want PNG 192/512 for install.
- **Recharts** is installed but not yet used — first real chart lands with Nutrition; verify SSR/client boundaries.
- Idempotency is guaranteed by deterministic ids + pull‑before‑seed + last‑write‑wins — **preserve these** for every new module (add regression tests like `idempotency.test.ts`).
