# LifeOS — Architecture

This document explains how LifeOS is put together, the decisions behind it, and the paths left open for the remaining modules. It is the reference every new module should follow.

## 1. Principles

1. **Offline‑first, for real.** The app must be fully usable with no network and no backend. Therefore the local database (IndexedDB) is the **source of truth**, not a cache. The cloud is a sync target.
2. **Multi‑user from day one.** Even though there is one user today, every record carries a `user_id` and every cloud table enforces Row Level Security. Nothing is scoped “later”.
3. **Pure rules, thin UI.** Gamification math (XP, levels, streaks, lives, achievements) lives in pure, unit‑tested functions with no I/O. The UI and data layer call into them.
4. **No fake functionality.** Unbuilt modules render an explicit _Coming soon_ state inside the real shell. Integrations that lack an official API get honest manual/CSV fallbacks, never invented endpoints.

## 2. Layered structure

```
UI (App Router pages, "use client")
  └─ Hooks (src/hooks)              reactive reads via Dexie liveQuery
      └─ Actions (src/lib/data/actions.ts)   compose multi-entity operations
          └─ Services (src/lib/data/*.ts)    habits, game, settings, export
              └─ Repository (src/lib/data/repository.ts)   write-through + outbox
                  ├─ Dexie (src/lib/db)      IndexedDB = source of truth
                  └─ Sync engine (src/lib/sync)  ⇄ Supabase (when configured)
Pure engine (src/lib/game)          XP curve, streaks, day evaluation, achievements
Providers (src/components/providers) session/auth, theme, i18n, tooltip, toaster
```

Reads flow through **Dexie `useLiveQuery`**, so any write anywhere re‑renders every dependent view automatically — no manual cache invalidation. **Writes** go through the repository, which stamps timestamps, writes to IndexedDB, and (when a cloud backend exists) appends to the sync outbox in the same transaction.

## 3. Offline‑first sync

- **Local store:** Dexie (`src/lib/db/dexie.ts`), one table per entity, indexed by `user_id` and useful keys (e.g. `[user_id+day]`).
- **Outbox:** every mutation appends a row to `mutations`. In **local mode** (no Supabase) the outbox is skipped — there is nothing to drain, so it never grows unbounded.
- **Sync engine** (`src/lib/sync/sync-engine.ts`): push the outbox to Supabase, then pull rows changed since the last pull. Conflict resolution is **last‑write‑wins on `updated_at`**. Deletes are tombstones (`deleted: true`) so peers converge.
- **First connection backfill:** when a device that started in local mode first connects to the cloud, the engine seeds the outbox with all existing local records, then pushes — so nothing is stranded on the device.
- **Cadence:** on login, on `online` events, and every 30s while authenticated.

### Cloud storage model — and why

Each entity maps to a Supabase table with columns `(id, user_id, created_at, updated_at, deleted, data jsonb)` where `data` holds the full offline record. This is a deliberate trade‑off:

- ✅ The client record shape is identical on both sides → the sync adapter is a straight map.
- ✅ RLS is uniform and trivially correct (`auth.uid() = user_id`) across every table.
- ✅ Conflict resolution is a simple timestamp comparison.
- ⚠️ Less server‑side relational querying — acceptable because LifeOS does its analytics **locally** on the full dataset.

**Future normalization path:** because the indexed/queryable fields already live in real columns and the payload is JSON, a later migration can promote hot fields (e.g. `habit_logs.day`, `challenges.status`) into typed columns without changing the client. See `supabase/migrations/0001_init.sql`.

## 4. Authentication & session

`SessionProvider` (`src/components/providers/session-provider.tsx`) resolves one of two worlds:

- **Local mode** (Supabase not configured): a fixed local user id, no login required, a persistent “Local mode” badge. The app is fully functional.
- **Cloud mode**: Supabase email/password + Google OAuth (PKCE via `/auth/callback`). Unauthenticated users are routed to `/login`. The Next.js **proxy** (`src/proxy.ts`, formerly “middleware”) refreshes the session cookie per request.

On any resolved user id, the provider bootstraps data (`ensureUserData`), loads locale, reconciles lives, and kicks off sync — each guarded to run once.

## 5. Gamification engine

Pure functions in `src/lib/game/`:
- `xp.ts` — level curve `cost(L) = 100·L^1.45` (smooth, escalating, never impossible); `levelProgress(totalXp)` resolves level + progress.
- `engine.ts` — `currentStreak` / `longestStreak`, `evaluateDay` (does a day cost a life?), `resolveAchievements` (progress + locked→unlocked transitions).
- `achievements-def.ts` / `challenges-def.ts` — static catalogs (versioned in code, no DB round‑trip).
- `config.ts` — default XP/lives/shop values; **all user‑editable** via Settings (persisted on `user_settings.game`). Nothing is hardcoded into the engine.

Orchestration lives in `src/lib/data/game.ts` and `actions.ts`: awarding XP writes to an append‑only ledger; the “all habits done” daily bonus is reconciled reversibly; lives are reconciled once per day for fully‑past days; achievements recompute after any XP‑affecting action.

**Lives & the challenge loop.** Missing `missThreshold`+ required habits on a non‑free day costs a life (streak shields absorb one). At **0 lives**, a global watcher shows the full‑screen **roulette**; the outcome is chosen by weighted random up front, then the reel animates to it. The user accepts a hard, verifiable, one‑day **physical** challenge, submits **evidence** (image/link/note), and only on **verification** are all lives restored (+XP). Lives are never auto‑restored.

## 6. Dashboard widget system

`src/lib/dashboard/widgets.ts` is the catalog; `dashboard-store.ts` (Zustand, persisted) holds per‑user order/hidden/spans; `dashboard-grid.tsx` renders a 12‑column responsive grid with **dnd‑kit** drag‑to‑reorder plus per‑widget resize/hide in edit mode. New widgets: add to the catalog + a case in `widget-registry.tsx`.

## 7. Security

- Every cloud table has `user_id` + RLS with owner‑only select/insert/update/delete (`0001_init.sql`).
- Storage objects are scoped to a per‑user folder.
- The anon key is public by design (RLS is the boundary); the service‑role key is **never** shipped to the client and isn’t used by the current client‑only build.
- No secrets in code — all via env (`src/config/env.ts`).

## 8. Internationalization, theming, PWA

- **i18n**: lightweight typed dictionaries (`src/lib/i18n`) with `{var}` interpolation; locale in a persisted store, mirrored to DB settings. en / es / ca.
- **Theming**: OKLCH token system in `globals.css`; dark‑first with a complete light palette already defined (toggle ships, light is future‑default‑ready). Per‑domain accent tokens keep colors purposeful.
- **PWA**: `manifest.ts`, `public/sw.js` (network‑first navigations, SWR static assets), offline page. The service worker runs in production only. See [PWA.md](PWA.md).

## 9. Testing

Vitest covers the highest‑value logic: the XP/level curve, streak math, day/lives evaluation, achievement resolution, date keys, and the weighted challenge picker. Run `npm test`.

## 10. Extending LifeOS (the recipe for the next module)

1. Add types to `src/lib/types.ts` (extend `OwnedRecord`).
2. Add a Dexie table + indexes (`dexie.ts`) and register it in the sync `REGISTRY` (+ a table in the migration).
3. Write a service in `src/lib/data/<module>.ts` using the repository helpers.
4. Add reactive hooks in `src/hooks`.
5. Build the page under `src/app/(app)/<module>/` using `PageContainer`/`PageHeader` and the shared UI; replace the _Coming soon_ placeholder.
6. Emit XP events where it makes sense (reuse `awardXp` + `recomputeAchievements`).
7. Add a dashboard widget if useful.
8. Add tests for any new pure logic.
