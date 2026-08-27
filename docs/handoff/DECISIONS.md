# LifeOS — Decisions Log

Important decisions and their rationale. These are **load‑bearing** — don't regress them without a good reason.

## Architecture
1. **Offline‑first.** The app must be fully usable with no network and no backend. Non‑negotiable.
2. **IndexedDB (Dexie) is the source of truth**, not a cache. The cloud is a sync target. ("Supabase alone doesn't give offline.")
3. **Write‑through repository + outbox.** Every write hits IndexedDB and (only in cloud mode) appends a mutation to a `mutations` outbox in the same transaction. `src/lib/data/repository.ts`.
4. **Supabase for cloud + auth** (Postgres + Auth + Storage). Chosen for RLS + Postgres + generous free tier.
5. **Blob‑per‑entity cloud schema**: each table = `(id, user_id, created_at, updated_at, deleted, data jsonb)`. Rationale: identical record shape both sides → trivial sync; uniform, obviously‑correct RLS; simple last‑write‑wins. Trade‑off: less server‑side relational querying — acceptable because analytics run locally. Future normalization path documented in `docs/ARCHITECTURE.md`.
6. **Vercel for deployment**, auto‑deploy on push to `main`. Repo GitHub `davidarteee/life_os`.

## Sync & data integrity
7. **Last‑write‑wins on `updated_at`** for conflicts (pure `shouldApplyRemote`, tested). Equal timestamps keep local → pull is idempotent.
8. **Soft deletes (tombstones)** so peers converge on deletion; UI filters `deleted`.
9. **Deterministic ids ONLY for seeded/singleton records** (default habits, `game_state`, `user_settings`, and any future seeded/default data): `deterministicId(userId+':'+key)` from `src/lib/id.ts`, formatted as a UUID. Two devices generate the SAME id → upsert MERGES instead of duplicating. **User‑created records use random `newId()`** (must be unique per create). _This fixed a real multi‑device duplication bug — see the idempotency tests._
10. **Pull before seed.** `ensureUserData` runs an initial `runSync` (pull) before deciding to seed defaults, so a second device doesn't recreate them.
11. **`makeRecord` spreads `partial` first**, then applies owned fields — so a caller passing `id: undefined` never clobbers the generated id (this was a latent invalid‑key bug).
12. **First‑connection backfill**: a formerly‑local device seeds its outbox with all local records on first cloud sync.
13. **Adopt local→account data** on first cloud sign‑in (guarded once per device, only into a fresh account) so local‑mode data isn't lost.

## Auth & multi‑user
14. **Multi‑user from day one.** Every user‑owned record has `user_id`; every cloud table has **owner‑only RLS** (`auth.uid() = user_id`, 4 policies each). Enforced by `lifeos_create_entity()` in migrations.
15. **Google OAuth first** (PKCE via `/auth/callback`), architecture ready for Apple/Facebook/email — providers pluggable via `SessionProvider`. Email/password already wired.
16. **Local mode** is a first‑class state: no Supabase configured → fixed local user, no login, full functionality. Login page offers "Enter LifeOS".
17. **OAuth redirect must be query‑free** (`/auth/callback`, no `?next=`) so it matches Supabase's redirect allow‑list exactly.
18. **Vercel `NEXT_PUBLIC_*` env vars must be type "Config", not "Secret".** Secret masks the value (bullets) and breaks the inlined key. The anon key is public by design (RLS is the boundary).
19. **`@supabase/ssr` ≥ 0.12** (0.7 had a cookie‑encoding "ByteString" bug during the server code exchange).

## Product / UX
20. **One central, unified Calendar** — never per‑module calendars. Modules contribute dated items via a provider registry (`src/lib/calendar/calendar.ts`).
21. **Spanish is the default/primary language** (also en, ca). All UI strings go through i18n; no hardcoded English.
22. **Dark mode is the primary theme** (light palette defined, toggle ships, light is a token swap away).
23. **Mobile is intentionally vertical/stacked**, not a shrunk desktop. Desktop uses wide grids.
24. **No fake functionality.** Unbuilt modules show an honest "Coming soon" in‑shell page. Integrations without an official API get manual/CSV fallbacks — never invented endpoints.
25. **Gamification is cross‑module but non‑duplicative.** Habits, tasks, and hitting nutrition targets grant XP. **Exercise grants NO XP** (a "do sport" habit already rewards it). All XP/lives/shop values are user‑configurable in Settings.
26. **Diet↔exercise energy balance is transparent + configurable** (`informational` default never changes the target; `adjustTarget` shows the exact formula). No hidden auto‑adjustment.
27. **Avoid generic "AI template" visuals** (e.g. thick colored side‑tab borders on cards — the design hook flags these).

## Deferred on purpose
- **Apple Calendar** bidirectional sync (no web push API) — build internal calendar first; ICS/CalDAV later if viable.
- **Strava/Suunto** live integration — build the manual exercise log first; Strava via official OAuth later, Suunto via Strava‑as‑hub or file import.
- **Broker APIs** (Trade Republic/MyInvestor) — none public; manual + CSV import.
- **General mobile UI/UX polish pass** — do it later as one phase; only fix blocking responsive bugs meanwhile (user's explicit preference).
- **Raster PWA icons** (192/512 PNG) for maximal install reliability — SVG icon ships now.
- **AI assistant writes** — analysis/read‑only first; no data mutation initially.
