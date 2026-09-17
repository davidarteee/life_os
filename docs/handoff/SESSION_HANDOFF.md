# LifeOS — Session Handoff (read me first)

Compact continuity brief for a fresh Claude session. For depth see the other
files in this folder (`PROJECT_CONTEXT.md`, `DECISIONS.md`, `MODULE_SPECIFICATIONS.md`,
`NEXT_STEPS.md`) and `docs/ARCHITECTURE.md`. A persistent memory also auto-loads
each session (`.claude/.../memory/lifeos-project-state.md`) — keep it in sync.

## What this is
**LifeOS** — a personal life OS (habits, tasks, events, calendar, health, gamification…)
as an offline-first **PWA** used daily on **Windows PC + iPhone**. One primary user
(David) but built **multi-user with RLS from day one**. Default language **Spanish**
(also en/ca). Dark-first. Repo GitHub **`davidarteee/life_os`** → **Vercel**
`https://life-os-pied-psi.vercel.app` (auto-deploys on push to `main`). Supabase ref
`pqrbpkmyafqwogpmwmst`, Google OAuth. `.env.local` holds keys (gitignored). Note: local
dev shows the LOGIN page (cloud mode), not the local-mode bypass, because Supabase IS
configured — a browser smoke test needs the user to sign in.

## Current state (main HEAD ≈ `bf6f536`, 2026-09, deployed) — 125 tests pass
Verify green before shipping: `npx tsc --noEmit`, `npx vitest run`, `npm run build`, `npx eslint .`.

**Built & working modules:**
- **Foundation** (shell, iOS-safe-area header/drawer, cinematic hero with Ken-Burns animated backdrops, PWA, i18n es/en/ca, Settings), **Dashboard** (customizable widgets: drag/reorder/hide + resize **horizontally AND vertically**).
- **Habits + Gamification** (XP ledger, level curve `cost(L)=200·L^1.5`, 3 lives, free days, XP shop, achievements, 0-lives challenge roulette). Today's-habits section has **day navigation** + **drag-to-reorder**. Profile testing tools include **"Reset progress"** (`resetGamification`: zeroes XP/level, refills lives, clears ledger+achievements, stamps `gamificationResetAt` so history doesn't re-award).
- **Tasks** — inbox/backlog ("Task list") + Today + scheduling. **Priority was removed**; tasks now use shared **Categories**. Lists ordered by date.
- **Events** — dated reminders (exams, appointments…): title, date, optional time, **category**, notes, **recurrence** (every N days/weeks/months/years). No XP/lives.
- **Categories** (shared by Tasks + Events, user-editable: name/color/icon; add/edit/delete; ~22-color palette). Seeded with 11 defaults via deterministic ids. Resolve legacy via `resolveCategoryId()`.
- **Calendar** — ONE unified calendar with **Month + Week** views (switcher), embedded on Tasks & Events pages too. Items render as **category-colored chips**; a leading icon differentiates kinds (task = check box, event = category icon). Dashboard has a colored **week** widget.
- **Nutrition** — 5 meal blocks, in-code food catalog + user foods + recent, quantity→live macros, snapshot macros, **macro rings**, transparent energy-balance card, targets/energy-mode in Settings, nutrition XP + achievements.
- **Exercise/Workouts** — manual log (source manual/strava/suunto ready), **no XP** (do-sport habit rewards it).
- Settings maintenance: **"Remove duplicates"** (dedupe habits/tasks/events) and **"Reset everything"** (wipes cloud+local).

Placeholders (real "Coming soon" pages, NOT built): assistant, projects, study, notes, sleep, goals, learning, books, movies, music, contacts, travel, wishlist, investments, finance, databases.

## Migrations (run manually in the Supabase SQL editor)
`0001_init` ✅ · `0002_tasks` ✅ · `0003_nutrition` · `0004_events` · `0005_categories`.
Each new Supabase table needs its migration run or that table's sync push fails silently.
**As of this handoff, confirm with the user whether 0003/0004/0005 have been applied.**

## Architecture (essentials — don't fight these)
- **IndexedDB (Dexie) is the source of truth**, not a cache. Writes → `src/lib/data/repository.ts` (stamps + outbox) → Dexie; reads → Dexie `useLiveQuery`. Cloud = **blob-per-entity** table `(id, user_id, created_at, updated_at, deleted, data jsonb)` + owner-only RLS.
- **Sync** (`src/lib/sync/sync-engine.ts`): push→pull, last-write-wins on `updated_at`, tombstone deletes. The pull cursor re-scans a 5-min overlap + heals a poisoned future cursor (fixed a real "nothing syncs cross-device" bug). `wipeCloudData` for resets.
- **A new module = 3 things or sync breaks silently:** Dexie `version(n).stores` bump (now at **v5**) + sync `REGISTRY` entry + `000X_*.sql` migration. Then service (`src/lib/data/*`) → hooks (`src/hooks`) → page under `src/app/(app)/<m>/` (`ready:true` in `nav-config.ts`) → dashboard widget → i18n es/en/ca → tests.
- **Idempotency (hard-won, keep):** seeded/singleton records use `deterministicId(userId+':'+key)` (merge across devices); user records use random `newId()`. Pull before seed.

## Non-negotiable decisions
Offline-first; IndexedDB = truth; multi-user + RLS everywhere; ONE unified calendar; Spanish default via i18n (no hardcoded English); dark default; mobile vertical/stacked; no fake functionality / no invented APIs (manual/CSV fallbacks, e.g. Strava/Suunto later via official OAuth or file import); gamification cross-module but **no XP for exercise**; Vercel `NEXT_PUBLIC_*` env vars must be type **Config** not Secret.

## Working style with this user
Ship small, verified increments to `main` (auto-deploys). Always run tsc/eslint/vitest/build before pushing. The user works on PC + iPhone; call out iOS PWA caching (favicon/service-worker can need a full reinstall). Answer honestly about web-platform limits (e.g. push notifications need Web Push + a scheduler; discussed, not yet built).

## How to continue
1. Read this file, then the memory, then `NEXT_STEPS.md` / `MODULE_SPECIFICATIONS.md` for the target module.
2. Confirm which migrations the user has applied.
3. Follow the module pattern + idempotency rules; add tests; keep i18n complete.
4. Deferred/possible next: push notifications (Web Push + Vercel Cron), Goals, Study+Pomodoro, general mobile polish. See `NEXT_STEPS.md`.
