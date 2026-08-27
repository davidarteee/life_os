# LifeOS — Session Handoff (read me first)

Compact continuity brief. For depth: `PROJECT_CONTEXT.md`, `CURRENT_STATE.md`, `MODULE_SPECIFICATIONS.md`, `DECISIONS.md`, `NEXT_STEPS.md` (same folder). Also `docs/ARCHITECTURE.md`.

## What this is
**LifeOS** — a personal life OS (habits, tasks, calendar, health, finance, goals…) with a cross‑module **gamification** layer (XP/levels/lives/achievements/challenges). Offline‑first **PWA** used daily on **Windows PC + iPhone**. One primary user now; built multi‑user (RLS everywhere) from day one. Default language **Spanish**.

## Current state (main = `6a6b296`, deployed)
- **Built ✅:** Foundation (shell, hero, PWA, i18n es/en/ca, Settings), customizable **Dashboard**, **Habits + Gamification**, **Tasks**, **Calendar** (one unified month view). `tsc`/`eslint`/`build` clean, **57 tests pass**.
- **Live:** Vercel `https://life-os-pied-psi.vercel.app` (auto‑deploys on push to `main`, GitHub `davidarteee/life_os`). Supabase ref `pqrbpkmyafqwogpmwmst`, Google OAuth working, multi‑device sync validated (no duplicates).
- **Migrations applied:** `0001_init.sql`, `0002_tasks.sql`. (`0003_nutrition.sql` exists only on the WIP branch, NOT applied.)
- **Next module (in progress):** **Nutrition + Exercise**. A non‑building **data‑layer scaffold** is on branch `wip/nutrition-exercise` (reference only). Full spec + plan in `MODULE_SPECIFICATIONS.md` and `NEXT_STEPS.md`.

## Architecture (essentials)
- Stack: Next.js 16 (App Router) · React 19 · TS · Tailwind v4 · shadcn/ui · Supabase (`@supabase/ssr` 0.12) · **Dexie/IndexedDB** · Zustand · dnd‑kit · Recharts · Vitest+fake‑indexeddb.
- **IndexedDB is the source of truth.** Writes → `repository.ts` (stamps + outbox) → Dexie; reads → Dexie `useLiveQuery`. Sync engine (`src/lib/sync/sync-engine.ts`) push→pull, **last‑write‑wins on `updated_at`**, tombstone deletes.
- **Cloud = blob‑per‑entity**: table `(id, user_id, created_at, updated_at, deleted, data jsonb)` + owner‑only RLS. New module = new Dexie `version(n).stores` + sync `REGISTRY` entry + `000X_*.sql` migration (all three, or sync breaks).
- Layers: pages → `src/hooks` → `src/lib/data/actions.ts` (compose) → `src/lib/data/*.ts` services → repository → Dexie/sync. Pure engines in `src/lib/game`, `src/lib/calendar`, `src/lib/nutrition`.
- Auth: `SessionProvider` = local mode (no Supabase) OR cloud (email + Google PKCE via `/auth/callback`); `src/proxy.ts` refreshes session.

## Non‑negotiable decisions
1. Offline‑first; IndexedDB = source of truth; Supabase = sync + auth.
2. **Idempotency:** seeded/singleton records use `deterministicId(userId+':'+key)` (merge across devices); user records use random `newId()`. Pull before seeding. `makeRecord` spreads `partial` first. **Keep this — it fixed a real duplication bug; add regression tests per module.**
3. Multi‑user + RLS on every table; scope everything by `user_id`.
4. **One unified Calendar** (provider registry), never per‑module calendars.
5. Spanish default; every string via i18n (no hardcoded English). Dark theme default. Mobile = vertical/stacked, not shrunk desktop.
6. No fake functionality; no invented APIs (manual/CSV fallbacks). Avoid generic "AI template" visuals.
7. Gamification cross‑module but **no XP for exercise** (a habit already rewards it).
8. Vercel `NEXT_PUBLIC_*` env vars must be **Config** type (not Secret).

## Conventions
- Add a module by copying the Habits/Tasks pattern: types → Dexie table (version bump) → sync REGISTRY → migration → service (`src/lib/data/<m>.ts`) → hooks → page under `src/app/(app)/<m>/` (set `ready:true` in `nav-config.ts`) → dashboard widget → i18n es/en/ca → tests. See `docs/ARCHITECTURE.md` §10.
- Emit XP via `awardXp` + `recomputeAchievements`. Achievements: static defs in `src/lib/game/achievements-def.ts`, localized text in `src/lib/i18n/content.ts`, counters in `computeCounters()`.
- Env vars are in the user's `.env.local` and Vercel — **never** commit or print secrets.

## Known issues / risks
- Base64 images in synced records don't scale → move photo‑heavy data to Supabase Storage before Goals/Notes/Body.
- A new Supabase table needs its migration run by the user, or its sync push fails silently.
- Raster PWA icons missing (SVG only). Recharts installed but unused until Nutrition.

## How to continue (do this at the start)
1. Read this file, then `CURRENT_STATE.md` + `NEXT_STEPS.md` (and `MODULE_SPECIFICATIONS.md` for the target module).
2. Confirm `main` still builds: `npx tsc --noEmit`, `npx vitest run`, `npm run build`.
3. Build **Nutrition + Exercise** per `NEXT_STEPS.md` (fresh on `main`, using the WIP branch as reference). Follow the module pattern + idempotency rules; add tests.
4. When it's ready, tell the user to run `supabase/migrations/0003_nutrition.sql` in Supabase; then commit + push (Vercel auto‑deploys) and give the standard rundown (built / works / tests / decisions / limitations / manual PC+iPhone tests).
5. Do NOT regress the non‑negotiable decisions above.
