# LifeOS — Project Context

> Compact-but-complete overview. For the fastest start, read `SESSION_HANDOFF.md` first, then this.

## What LifeOS is
A **personal life operating system**: one app to run habits, tasks, calendar, health (nutrition + exercise), finance, goals, learning and more, with a **gamification layer** (XP, levels, lives, achievements, comeback challenges) that makes self‑improvement feel like a game. The user opens it daily to see what to do, track progress, and stay consistent.

## Product vision
A premium, motivating daily dashboard that unifies the areas of a person's life. Dense but clean. Every module contributes to a shared dashboard and a shared gamification/XP system. Long‑term it should be a real product a person uses every day and could become a multi‑user SaaS.

## Target user
- **Now:** a single primary user (David), used daily on **Windows PC + iPhone**.
- **Future:** built multi‑user from day one — every record carries `user_id`, Row Level Security is enforced on every cloud table. Nothing is single‑user‑only in the data model.

## Platforms
- Desktop web + **PWA** (installable), mobile web + **PWA on iPhone/Safari**.
- **Offline‑first**: fully usable with no network; syncs when back online.

## Offline‑first philosophy
**IndexedDB (via Dexie) is the source of truth**, not a cache. The app reads/writes locally first (works with zero backend), and a sync engine reconciles with the cloud when Supabase is configured and the user is signed in. This is deliberate — "Supabase alone does not give offline".

## Tech stack (verified in `package.json`)
- **Next.js 16.3.2** (App Router, Turbopack) · **React 19** · **TypeScript** (strict).
- **Tailwind CSS v4** · **shadcn/ui** (radix base, "radix-nova" style) · **lucide-react** · **next-themes** · **sonner** (toasts).
- **Supabase**: `@supabase/ssr` **0.12.5**, `@supabase/supabase-js` (auth + Postgres + Storage).
- **Dexie 4** (IndexedDB) + `dexie-react-hooks` (`useLiveQuery` reactive reads).
- **Zustand** (UI/dashboard/locale stores, persisted) · **@dnd-kit** (drag reorder) · **Recharts** (installed for charts).
- **Vitest 4** + **fake-indexeddb** + jsdom (tests) · ESLint 9.
- Deploy: **Vercel** (auto‑deploy on push to `main`). Repo: GitHub `davidarteee/life_os`.

## General architecture (layers)
```
UI pages ("use client")  →  hooks (src/hooks, Dexie liveQuery)  →
actions (src/lib/data/actions.ts, compose multi-entity ops)     →
services (src/lib/data/*.ts)  →  repository (write-through + outbox)  →
Dexie (IndexedDB, source of truth)  ⇄  sync engine  ⇄  Supabase
pure engines: src/lib/game (XP/levels/streaks/achievements), src/lib/calendar
providers: session/auth, theme, i18n, tooltip, toaster (src/components/providers)
```
Reads flow through **Dexie `useLiveQuery`** → any write re‑renders dependent views automatically (no manual cache invalidation). Writes go through the **repository**, which stamps timestamps, writes to IndexedDB, and (only when cloud is configured) appends to the sync **outbox** in the same transaction.

## Sync architecture
- **Local store**: Dexie, one table per entity, indexed by `user_id`.
- **Outbox**: every mutation appends to a `mutations` table; skipped entirely in local mode (nothing grows unbounded). File: `src/lib/sync/sync-engine.ts`.
- **Push then pull**, each cycle: push queued mutations (upsert `onConflict: id`), then pull rows changed since last pull. Conflict resolution = **last‑write‑wins on `updated_at`** (pure, tested `shouldApplyRemote`). Deletes are **tombstones** (`deleted: true`) so peers converge.
- **First‑connection backfill**: a device that started in local mode seeds the outbox with all local records on its first cloud sync, then pushes.
- **Cadence**: on login, on `online` events, every 30s while authenticated; also an initial pull inside `ensureUserData` BEFORE seeding (prevents duplicates).
- **Idempotency** (hard‑won): seeded/singleton records use `deterministicId(userId+':'+key)` so two devices converge; user‑created records use random `newId()`. See `DECISIONS.md`.

## Auth architecture
- `SessionProvider` (`src/components/providers/session-provider.tsx`) resolves two worlds: **local mode** (Supabase unconfigured → fixed local user, no login) and **cloud mode** (Supabase email/password + **Google OAuth** PKCE via `/auth/callback`).
- `src/proxy.ts` (Next "proxy", formerly middleware) refreshes the Supabase session cookie per request; no‑op in local mode.
- On any resolved user id: `ensureUserData` (adopt local→account data on first cloud login, pull, seed if empty), load locale, reconcile lives, start sync.

## Data & database
- **Cloud storage model = blob‑per‑entity**: each Supabase table has columns `(id uuid pk, user_id uuid, created_at, updated_at, deleted bool, data jsonb)` where `data` is the full offline record. Same shape both sides → trivial sync map + uniform RLS (`auth.uid() = user_id`). Rationale + future‑normalization path in `docs/ARCHITECTURE.md`.
- **Migrations** in `supabase/migrations/`, idempotent, run manually in Supabase SQL editor. `lifeos_create_entity('name')` provisions a table + indexes + owner‑only RLS in one call.
- Entities today: habits, habit_logs, game_state, xp_events, free_days, shop_purchases, user_achievements, challenges, user_settings, **tasks**.

## Existing integrations
- **Supabase** (auth + Postgres + Storage) — live, connected.
- **Google OAuth** — live, working PC + iPhone.
- **Vercel** — live deploy `https://life-os-pied-psi.vercel.app`.
- **Gmail quick‑access** — two plain external links to Gmail inboxes (no scopes; LifeOS never reads email).

## Planned future integrations
- **Strava** (official OAuth) and **Suunto** (limited — via Strava or file import) for Exercise. **Spotify** (official OAuth) for Music. **Apple Calendar** (ICS/CalDAV, no push API) — deferred. Market‑data provider for Investments. Each behind a provider abstraction; **no invented endpoints**, honest fallbacks. See `MODULE_SPECIFICATIONS.md`.

## Design & visual system
- **Dark‑first**, modern, minimal, premium. OKLCH token system in `src/app/globals.css` (complete light palette also defined; light mode is a token swap away). **Blue primary** + per‑domain accent tokens (productivity/health/finance/goals/entertainment/learning) used sparingly.
- Fonts: Geist (sans/mono) + Sora (headings). Subtle, fast animations only.
- **Responsive**: desktop uses wide grids; mobile is intentionally vertical/stacked and touch‑friendly (not a shrunk desktop). Avoid generic "AI template" patterns (e.g. the design hook flags thick side‑tab accent borders).

## Languages (i18n)
- **Spanish is the default/primary language.** Also English and Catalan. Custom typed dictionaries in `src/lib/i18n/` (`{var}` interpolation, English fallback). Generated/long content (achievement & challenge text, coming‑soon bullets) lives in `src/lib/i18n/content.ts`. Locale persisted in a Zustand store, mirrored to DB settings.

## Important decisions taken during development
See `DECISIONS.md` for the full list with rationale. Highlights: offline‑first with IndexedDB as source of truth; Supabase blob‑per‑entity + uniform RLS; deterministic ids for seeds/singletons (fixed a real multi‑device duplication bug); pull‑before‑seed; last‑write‑wins; one unified central calendar; Spanish default; dark default; XP integrated across modules but **no XP for exercise** (avoids duplicating the "do sport" habit); Vercel env vars for `NEXT_PUBLIC_*` must be type **Config** not Secret.
