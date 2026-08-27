# LifeOS — Module Specifications

Compact spec per module: **Objective · Functionality · Status · Integrations · Dependencies**. Statuses: ✅ built · 🚧 in progress · 🟡 placeholder (not built). The **build pattern every module follows** is in `docs/ARCHITECTURE.md` §10 (types → Dexie table + version bump + sync REGISTRY + migration → service → hooks → page → dashboard widget → tests → i18n es/en/ca).

---

## Habits + Gamification ✅
- **Objective:** daily rituals + a game layer that rewards consistency across ALL modules.
- **Functionality:** habits CRUD, cadence, targets, streaks, monthly history, per‑habit XP + required flag. Gamification: XP ledger, scaling levels (`cost(L)=100·L^1.45`), 3 lives (lost by missing `missThreshold`+ required habits on a non‑free day; streak shields absorb one), scheduled + purchased free days, XP shop, achievements (milestone families, hidden, progress), 0‑lives **challenge roulette** with **evidence‑verified** life restoration. All XP/lives/shop values user‑configurable in Settings.
- **Integrations:** none external. **Central to gamification** — other modules emit XP via `awardXp` + `recomputeAchievements`.
- **Dependencies:** foundation only. Everything else depends on it for XP.

## Tasks ✅
- **Objective:** capture → inbox → schedule onto a day → do it. Prevent an ever‑growing list.
- **Functionality:** CRUD, **inbox/backlog** (no date), **Today** (scheduled + overdue), assign a day, priorities (low/medium/high), complete (→ priority‑based XP `taskLow/Medium/High` + task achievements), dnd reorder within a list, search + priority filter, quick capture.
- **Integrations:** feeds the unified Calendar (via `tasksCalendarItems`).
- **Dependencies:** Gamification (XP). Calendar reads its dated tasks.

## Calendar ✅
- **Objective:** ONE central, unified monthly calendar for everything dated in LifeOS.
- **Functionality:** month grid (Mon‑first, today highlighted, nav), items shown as chips (desktop) / dots (mobile), interactive **selected‑day panel** to add/complete/reschedule. Aggregates via a **provider registry** — `collectCalendarItems()` in `src/lib/calendar/calendar.ts`. To add a module's dated items later, add one provider call there (documented in the file).
- **Integrations:** future — Study exams/assignments, Contacts birthdays, etc. all surface here. **Apple Calendar sync deferred** (no web push API; would be ICS/CalDAV — build the internal calendar first).
- **Dependencies:** Tasks (current provider). No per‑module calendars.

## Nutrition + Exercise 🚧 (NEXT — spec below is authoritative)
**Objective:** log daily food + exercise, compare against nutritional targets, show a transparent energy balance, and integrate with gamification without duplicating the "do sport" habit.

### Nutrition — functionality
- Log food per day, split into **five meal blocks**: Desayuno (breakfast), Media mañana (midmorning), Comida (lunch), Merienda (snack), Cena (dinner).
- Add foods to a block with a **quantity**; the app auto‑computes **calories, protein, carbs, fat** scaled from the food's per‑reference macros.
- A **food source** the user reuses: a **built‑in catalog** (in code) + **user‑created foods** (CRUD, favorites, frequency). Reuse frequent/recent foods quickly. Keep the food architecture **clean & extensible — NOT a giant world food DB**.
- **Daily targets** (editable in Settings): calories, protein, carbs, fat.
- Daily view: a **visual chart** of consumed vs target per macro (clearly show consumed and remaining), plus a **day summary**.

### Exercise — functionality
- Manual workout log: activity type, date, duration, distance (when relevant), calories (when relevant), notes.
- Architecture prepared for **Strava** and **Suunto** (a `source` field: manual/strava/suunto + `externalId`). Build the internal log first; document the integration strategy (see below).

### Diet ↔ Exercise relationship (transparent & configurable)
- Show the relationship between activity and targets. Do **NOT** rigidly auto‑modify targets in a way the user can't understand.
- Config `energyMode`: **`informational`** (default) → never changes the target, only shows burned + net (consumed − burned). **`adjustTarget`** → effective target = target + burned × `exerciseFactor` (0..1), with the formula shown. Fully configurable in Settings.

### Gamification integration (balanced, non‑duplicative)
- **No XP for exercise** (a "do sport" habit already rewards it — no double reward).
- XP for **hitting daily nutrition targets** (`config.xp.nutritionTarget`, default 20, once/day, reversible like the all‑habits bonus). Rule: calories within ±10% of target AND protein ≥ 90% of target.
- **Nutrition achievements**: days logged (1/7/30/100) and on‑target days (1/7/30). Adherence via these + the existing "Registrar nutrición" habit.

### Data model (already scaffolded on `wip/nutrition-exercise`)
- `Food` (user food): name, brand?, `per`, `unit`, macros per `per`, favorite, useCount. Random UUID (user‑created).
- `FoodEntry` (a logged food): day, meal, foodId?, name, quantity, unit, **snapshot macros** (so editing/deleting a Food never rewrites history).
- `Workout`: day, activity, durationMin?, distanceKm?, calories?, notes?, `source`, `externalId?`.
- `NutritionConfig` on `UserSettings.nutrition`: `targets`, `energyMode`, `exerciseFactor`.
- Built‑in foods: `src/lib/nutrition/foods-catalog.ts` (per‑locale names + macros per 100 g/ml or per unit). Logging a catalog food snapshots its macros; `foodId = "catalog:<id>"`.
- Pure math: `src/lib/nutrition/macros.ts` (scale/sum/progress), `energy.ts` (`computeEnergyBalance`).

### Dashboard
- Nutrition summary widget: calories/protein/carbs/fat consumed + progress vs targets. Exercise summary widget when data exists. Both navigate to their module.

### Strava / Suunto reality (research task — document in the module)
- **Strava**: official REST API v3 + OAuth2, viable for reading **your own** activities; requires registering an API app; rate‑limited; API terms restrict displaying others' data. Realistic: OAuth import of the user's own activities (later phase).
- **Suunto**: no broadly‑open public developer API. Realistic path: Suunto app already **auto‑uploads to Strava** → read from Strava; or **file import** (FIT/GPX/CSV). Recommend Strava‑as‑hub + file import; document the limitation. (Confirm current state at build time; do not invent endpoints.)

- **Status:** 🚧 data‑layer scaffold on WIP branch, does not build; UI/hooks/pages/tests not started.
- **Dependencies:** Gamification (nutrition XP + achievements), Settings (targets + energy config). Exercise data can inform the energy balance.

## Study 🟡
- **Objective:** university study tracking.
- **Functionality (planned):** subjects (name/color/professor/notes), exams + assignments (must surface on the **unified Calendar** and be able to spawn Tasks), study sessions via **Pomodoro** (timer already exists as a dashboard widget) with per‑subject time analytics.
- **Integrations:** Calendar (exams/assignments), Tasks (spawn tasks). **Dependencies:** Calendar, Tasks.

## Goals (5‑year + 6‑month vision) 🟡
- **Objective:** long‑term visualization, NOT task decomposition.
- **Functionality (planned):** a **5‑year vision** and rolling **6‑month vision boards** (kept as history: 2026 H1, H2, …). Categories: family, friends, personal development, career, sports, finance, hobbies. Each goal: title, description, category, target date, photos/visual content. Do **not** auto‑convert goals to tasks. **Dependencies:** Storage (photos). Keep goals ≠ tasks conceptually.

## Investments 🟡
- **Objective:** portfolio tracking.
- **Functionality (planned):** buy/sell transactions (asset, symbol, qty, price, fee, date, broker), computed avg price / current value / P&L / allocation. Near‑real‑time prices via a market‑data provider behind an **abstraction layer**. **Manual + CSV import** is acceptable — **no unofficial broker APIs** (Trade Republic / MyInvestor / Crypto.com have none public). **Dependencies:** none hard; provider abstraction.

## Projects 🟡
- **Objective:** projects distinct from tasks.
- **Functionality (planned):** name, description, category, dates, status, progress %, associated tasks, notes, links, files. A project can exist without tasks; a task can optionally belong to a project. **Dependencies:** Tasks (optional association).

## Notes 🟡
- **Objective:** structured notes.
- **Functionality (planned):** folders, pages, tags, markdown/rich text, checklists, images, links. Quick‑note dashboard widget already exists (localStorage). **Dependencies:** Storage (images).

## Learning 🟡
- **Objective:** self‑directed learning on any topic.
- **Functionality (planned):** topics/subtopics, references (articles/videos/links), notes, progress. **AI‑assisted learning plans** (suggest subtopics/sequence/resources; user stays in control). **Dependencies:** AI assistant (plans).

## Books 🟡
- **Objective:** reading tracker.
- **Functionality (planned):** statuses want/reading/done, cover, title, author, pages, progress, rating, notes; stats (books/pages read). Metadata lookup is a later add. **Dependencies:** none.

## Movies / Series 🟡
- **Objective:** watch tracker.
- **Functionality (planned):** want/watching/done, poster, rating, progress, notes. Metadata later. **Dependencies:** none.

## Music (Spotify) 🟡
- **Objective:** mini Spotify experience.
- **Functionality (planned):** now playing, play/pause/next/prev, volume, playlists, favourites, search — via **official Spotify OAuth** (Web Playback SDK + Web API). No fake player; document browser/API limits. **Dependencies:** Spotify OAuth.

## Sleep 🟡
- **Objective:** sleep tracking.
- **Functionality (planned):** manual log (hours, bed/wake time, quality), weekly/monthly trends, 8‑hour target; can connect to the "sleep 8 h" habit. Architecture ready for Suunto import later. **Dependencies:** Habits (sleep habit link), future Suunto.

## Databases 🟡
- **Objective:** Notion‑style structured views of the user's own data (tasks, habits, foods, workouts, books, …).
- **Functionality (planned):** table views with filter/sort/search/edit, all RLS‑scoped. **Dependencies:** reads every module's tables.

## AI assistant 🟡
- **Objective:** ask questions about your LifeOS data.
- **Functionality (planned):** read‑only, user‑scoped analysis, weekly summaries, recommendations, learning‑plan generation. **No data mutation initially.** Provider abstraction (OpenAI/Anthropic/Google), economical default model, cost/usage limits. Strictly scope by `user_id`; never expose another user's data. **Dependencies:** reads all modules; used by Learning for plans.
