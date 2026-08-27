# LifeOS

A personal operating system for habits, health, finance, goals, learning and growth — with a gamified progression layer (XP, levels, lives, achievements, and a comeback‑challenge system). Built as an **offline‑first, installable PWA** that runs fully on your device and syncs to the cloud when you connect Supabase.

> **Build your life. Every day.**

---

## Status

This repository is a **solid, production‑shaped foundation** plus **three complete vertical modules** — **Habits + Gamification**, **Tasks**, and a unified **Calendar** — built end‑to‑end, deployed to Vercel, and synced to Supabase (multi‑device validated). **Nutrition + Exercise** is the next module (in progress). Every other module has a real page inside the same shell, clearly marked _Coming soon_. See [docs/ROADMAP.md](docs/ROADMAP.md).

> **Continuing development?** Start with [docs/handoff/SESSION_HANDOFF.md](docs/handoff/SESSION_HANDOFF.md), then the rest of [docs/handoff/](docs/handoff/).

**Done and working today**
- Next.js (App Router) + TypeScript + Tailwind v4 + shadcn/ui design system (dark‑first, light‑ready).
- Collapsible sidebar, cinematic hero header (live clock, greeting, level/XP/lives), responsive desktop + mobile.
- **Customizable dashboard**: drag‑to‑reorder, resize, hide/restore widgets — persisted per user.
- **Offline‑first data layer**: IndexedDB (Dexie) is the source of truth + a sync outbox → Supabase.
- **Auth**: Supabase email + Google, with a first‑class **local mode** when Supabase isn’t configured.
- **PWA**: manifest, service worker, offline page, installable.
- **Habits**: CRUD, cadence, targets, streaks, monthly history, stats.
- **Gamification**: XP ledger, scaling level curve, 3‑lives system, scheduled + purchased free days, XP shop, achievements (categories, hidden/locked), and the **0‑lives challenge roulette** with **evidence‑verified** life restoration.
- **Tasks**: inbox/backlog, Today + overdue, per‑day scheduling, priorities, dnd reorder, search/filter, priority‑based XP + task achievements.
- **Calendar**: one unified month view aggregating dated items from modules (provider registry), interactive selected‑day panel.
- i18n (**Español** default / English / Català), data export (JSON + CSV), unit + sync/idempotency tests (57 passing).

---

## Quick start

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. With no environment configured, LifeOS runs in **local mode** — fully usable, data stored in your browser. To enable accounts and cross‑device sync, follow [docs/SETUP.md](docs/SETUP.md).

### Scripts
| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm test` | Run the unit tests (Vitest) |

---

## Documentation
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — layers, offline‑first sync, gamification engine, security model, data model, and design decisions.
- [docs/SETUP.md](docs/SETUP.md) — connect Supabase (auth + database + storage), Google OAuth, run migrations.
- [docs/PWA.md](docs/PWA.md) — install, service worker, production icon note.
- [docs/ROADMAP.md](docs/ROADMAP.md) — phased plan and per‑module status.

---

## Tech stack
Next.js 16 · React 19 · TypeScript · Tailwind CSS v4 · shadcn/ui (Radix) · Supabase (Auth + Postgres + Storage) · Dexie (IndexedDB) · Zustand · dnd‑kit · Recharts · Vitest · Vercel‑ready.
