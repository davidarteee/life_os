# LifeOS — Roadmap & module status

Built on the phased plan from the project brief. Everything shares the shell, design system, offline data layer, and gamification hooks already in place.

## Legend
- ✅ Built end‑to‑end
- 🟡 Page exists in‑shell, marked _Coming soon_
- ⛳ Has a documented integration risk / fallback

## Phase 1 — Foundation ✅
Next.js + TS + Tailwind + shadcn, theme system, collapsible sidebar, hero header, responsive shell, PWA, offline‑first data layer, Supabase auth (email + Google) + local mode, migrations + RLS, i18n scaffold.

## Phase 2 — Dashboard ✅
Cinematic hero, customizable widget grid (drag / resize / hide / restore, per‑user), the widget set, mobile layout.

## Phase 3 — Core
- **Habits** ✅ — CRUD, cadence, targets, streaks, monthly history, stats.
- **Gamification** ✅ — XP ledger + scaling levels, 3 lives, free days (scheduled + purchased), XP shop, achievements (categories, hidden/locked), **challenge roulette** + **evidence verification**, testing tools.
- **Tasks** ✅ — inbox/backlog, today+overdue, per‑day scheduling, priorities, dnd reorder, search/filter, priority‑based XP + task achievements.
- **Calendar** ✅ — one unified month view aggregating dated items from modules via a provider registry (`src/lib/calendar/calendar.ts`); interactive selected‑day panel. Apple Calendar sync ⛳ deferred.
- Projects 🟡 · Notes 🟡 · Goals/Vision 🟡

## Phase 4 — Health
Nutrition 🚧 · Workouts 🚧 — **in progress** on branch `wip/nutrition-exercise` (data‑layer scaffold only, does NOT build; see `docs/handoff/`). Sleep 🟡⛳ (Suunto import) · Body tracking 🟡. Exercise → calorie balance ⛳ (Strava/Suunto official APIs + manual/CSV fallback).

## Phase 5 — Finance
Investments 🟡⛳ (market‑data provider behind an abstraction; **manual + CSV** transaction entry — no unofficial broker APIs) · Personal finance 🟡.

## Phase 6 — Personal
Study + Pomodoro 🟡 (Pomodoro timer already works as a dashboard widget) · Books 🟡 · Movies & Series 🟡 · Learning 🟡 · Contacts 🟡 · Travel 🟡 · Wishlist 🟡 · Music 🟡⛳ (Spotify official OAuth).

## Phase 7 — AI Assistant 🟡
Read‑only, user‑scoped analysis and learning plans; provider abstraction; usage limits. Analysis‑only (no data mutation) per the brief.

## Phase 8 — Integrations
Priority order: Apple Calendar ⛳ · Spotify (official OAuth) · Strava (official OAuth) · Suunto ⛳ · brokers (manual/CSV). Each behind a provider abstraction; **no invented endpoints**, honest fallbacks + documented limits.

## Phase 9 — Offline & production hardening
Deepen conflict handling, add raster PWA icons, broaden tests, Vercel production deploy.

---

### Integration reality check (per the brief’s “don’t fake it” rule)
| Provider | Official API? | LifeOS approach |
| --- | --- | --- |
| Spotify | ✅ OAuth | Real mini‑player via Web Playback + Web API |
| Strava | ✅ OAuth | Activity import |
| Suunto | ⚠️ limited | Manual entry + file/CSV import |
| Apple Calendar | ⚠️ no web push API | ICS export/import, optional CalDAV; local calendar stays useful |
| Trade Republic / MyInvestor | ❌ none public | Manual transactions + CSV import; live prices via a market‑data API |
