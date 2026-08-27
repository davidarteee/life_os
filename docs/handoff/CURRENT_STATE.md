# LifeOS — Current State

_Snapshot as of the Tasks + Calendar milestone. `main` builds clean, tests green, deployed._

## Git
- Repo: GitHub **`davidarteee/life_os`**. Branch **`main`** is the source of truth and is deployed.
- **`main` HEAD**: `6a6b296` — `style(tasks): drop the priority side-tab border on task rows`.
- **WIP branch `wip/nutrition-exercise`**: a partial Nutrition/Exercise **data‑layer scaffold** that **does NOT build** (preserved so the next session can reference/cherry‑pick; do not merge as‑is). Contains: nutrition/exercise types, Dexie v3 tables + sync REGISTRY, `supabase/migrations/0003_nutrition.sql`, `src/lib/data/{foods,nutrition,workouts}.ts`, `src/lib/nutrition/{config,macros,energy,foods-catalog}.ts`, and partial gamification wiring. Incomplete: `computeCounters()` not updated for the new counters, no reconcile action, **no hooks/UI/pages**.

## Verified quality gates on `main`
- `npx tsc --noEmit` → clean.
- `npx vitest run` → **57 tests pass** (9 files).
- `npm run build` → 34 routes, success.
- ESLint → 0 errors (a few known React‑Compiler warnings on intentional SSR‑safe patterns).

## Modules — fully built & working (verified)
- **Foundation**: shell (collapsible sidebar, slim top bar, mobile drawer), cinematic hero header, theme system, PWA (manifest + service worker + offline page), i18n (es default/en/ca), Settings (profile, language, currency, appearance, gamification config, data export JSON/CSV, "reset device data", integrations status).
- **Dashboard**: per‑user customizable widget grid (drag/resize/hide/restore, persisted, self‑healing to surface new widgets). Real widgets wired.
- **Habits**: CRUD, cadence (daily/weekdays/custom), targets, streaks, monthly history heatmap, stats, ordering, per‑habit XP + required flag. 9 localized default habits seeded (deterministic, idempotent).
- **Gamification**: XP ledger, scaling level curve, 3 lives + reconciliation, scheduled + purchased free days, XP shop, achievements (categories, hidden/locked, progress), **0‑lives challenge roulette** with **evidence‑verified** life restoration, testing tools.
- **Tasks**: inbox/backlog, Today view (with overdue), per‑day scheduling, priorities (low/medium/high), completion → priority‑based XP + task achievements, dnd reorder within a list, search + priority filter, quick capture.
- **Calendar**: one unified month view; aggregates dated items via a provider registry (`src/lib/calendar/calendar.ts`, tasks provider today); month nav + interactive selected‑day panel to add/complete/reschedule.

## Modules — placeholders (real page in‑shell, marked "Coming soon", NOT built)
assistant, projects, study, notes, goals, learning, books, movies, music, contacts, travel, wishlist, investments, finance, sleep, databases, nutrition, workouts. (`nutrition`/`workouts` are placeholders on `main`; scaffolding lives on the WIP branch.)

## What is deployed
- **Vercel**: `https://life-os-pied-psi.vercel.app` — production, auto‑deploys on push to `main`. Currently serving `6a6b296` (Tasks + Calendar).
- PWA installable on PC and iPhone.

## What is connected to Supabase
- Project ref **`pqrbpkmyafqwogpmwmst`** (region West EU / Ireland).
- **Auth**: Email/password + **Google OAuth** enabled and working (validated PC + iPhone).
- **Tables + RLS**: created via migrations 0001 + 0002 (owner‑only RLS verified: 4 policies/table, RLS on).
- Multi‑device sync validated: same data on PC & iPhone, offline→online sync, no duplicates.

## Migrations
| File | Purpose | Applied? |
| --- | --- | --- |
| `0001_init.sql` | Foundation: habits, habit_logs, game_state, xp_events, free_days, shop_purchases, user_achievements, challenges, user_settings + helper functions + storage bucket + RLS | **Yes** |
| `0002_tasks.sql` | `tasks` table (+ RLS) | **Yes** (user ran it; task sync verified) |
| `0003_nutrition.sql` | foods, food_entries, workouts (+ RLS) | **No** — exists only on `wip/nutrition-exercise`, not applied |

## Environment variables (no secrets here)
Set in `.env.local` (gitignored) for local dev, and in **Vercel → Settings → Environment Variables** for production. All are **public** (protected by RLS) and on Vercel must be type **Config**, NOT Secret:
- `NEXT_PUBLIC_SUPABASE_URL` — the Supabase project URL.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — the Supabase anon/publishable key.
- `NEXT_PUBLIC_SITE_URL` — optional; canonical site URL for OAuth redirects.
> With none set, the app runs in **local mode** (no auth, device‑local data). Values live in the user's `.env.local` and Vercel; they are intentionally not reproduced in any doc.

## What's missing / next
- **Nutrition + Exercise** module: finish it (spec in `MODULE_SPECIFICATIONS.md`, plan in `NEXT_STEPS.md`). Run migration `0003_nutrition.sql` when built.
- General **mobile UI/UX polish pass** (deferred; fix only blocking responsive bugs meanwhile).
- Remaining modules per roadmap (Study, Goals, Investments, etc.).
- Production **raster PWA icons** (currently SVG only — see `docs/PWA.md`).
