# Grove — Architecture & Plan

## Status: Phase 1 — In Progress

---

## Product Summary

Grove is a local-first personal productivity app where every activity (workouts, reading, learning, focus, tasks) waters a living garden. Habits are plants that grow with consistency and wilt with neglect. Built with Expo/React Native for Android, iOS, and desktop web.

---

## Architecture

### Stack
| Layer | Technology |
|---|---|
| Framework | React Native + Expo SDK 52, TypeScript strict |
| Routing | expo-router (file-based) |
| Storage (native) | expo-sqlite |
| Storage (web) | expo-sqlite (WASM/OPFS — Expo SDK 52 supports this) |
| State | Zustand |
| Validation | Zod |
| Animation | react-native-reanimated |
| SVG | react-native-svg |
| Notifications | expo-notifications (native), in-app fallback (web) |
| Testing | Jest + RNTL, Playwright (web e2e) |
| Lint | ESLint + Prettier |

### Design Decisions
- **Day boundary**: configurable "day starts at" hour, default 4 AM. A "logical day" runs from dayStartHour to dayStartHour next day. All streak/activity logic uses logical days.
- **Streak recovery**: after a miss, plant drops one health level. Recovery requires 2 extra consecutive days beyond the normal requirement. Recovery state is tracked per habit.
- **Rest tokens**: 2/month default, configurable. Using a token preserves the streak for that day.
- **ActivityLog as truth**: garden state, stats, streaks are all derived from the activity log. No denormalized streak counters stored (computed fresh from log with caching).
- **Storage abstraction**: a Repository interface wraps all DB calls. Same interface for native (expo-sqlite) and web (expo-sqlite WASM). If web support fails, fall back to IndexedDB wrapper.

---

## Folder Structure

```
grove/
├── app/                        # expo-router file-based routes
│   ├── (tabs)/                 # tab layout
│   │   ├── index.tsx           # Home / Today
│   │   ├── garden.tsx          # Garden view
│   │   ├── exercises.tsx       # Exercise tracker
│   │   ├── tasks.tsx           # Tasks & schedule
│   │   ├── library.tsx         # Reading + Roadmaps
│   │   └── more.tsx            # Settings, search, insights
│   ├── exercise/[id].tsx       # Exercise detail
│   ├── book/[id].tsx           # Book detail
│   ├── task/[id].tsx           # Task detail
│   ├── roadmap/[id].tsx        # Roadmap detail
│   ├── focus.tsx               # Focus session
│   ├── insights.tsx            # Weekly review
│   ├── settings.tsx            # Settings
│   ├── search.tsx              # Global search
│   ├── reader/[id].tsx         # Article reader
│   ├── onboarding.tsx          # Onboarding
│   └── _layout.tsx             # Root layout
├── src/
│   ├── db/
│   │   ├── schema.ts           # Table definitions
│   │   ├── migrations.ts       # Migration system
│   │   ├── connection.ts       # DB connection factory
│   │   └── repositories/       # Data access layer
│   ├── engine/
│   │   ├── streak.ts           # Streak computation (pure)
│   │   ├── streak.test.ts      # Extensive tests
│   │   ├── timer.ts            # Timestamp-based timer logic
│   │   └── recurrence.ts       # Recurrence rule engine
│   ├── stores/                 # Zustand stores
│   ├── design/
│   │   ├── tokens.ts           # Design tokens
│   │   ├── theme.ts            # Theme provider
│   │   └── typography.ts       # Type scale
│   ├── components/
│   │   ├── ui/                 # Primitives
│   │   ├── garden/             # Plant SVGs
│   │   ├── layout/             # Shell, sidebar, tabs
│   │   └── shared/             # Calendar, charts
│   ├── hooks/                  # Custom hooks
│   ├── utils/                  # Pure utilities
│   └── types/                  # TypeScript types
├── assets/fonts/               # Inter font files
├── __tests__/                  # Tests
├── e2e/                        # Playwright tests
├── proxy/                      # Optional RSS proxy
├── QA.md
├── README.md
└── PLAN.md
```

---

## Design Tokens

### Palette
Light mode — warm neutrals:
- Background: #FAFAF7, Surface: #FFFFFF, Surface Raised: #F5F4F0
- Border: #E8E6E0, Text Primary: #1A1A18, Text Secondary: #6B6962, Text Tertiary: #9C9A92

Accent: #2D7A4F (forest green), Accent light: #E8F5EC, Accent dark: #1B5E38

Plant health: Thriving #2D7A4F, OK #7FB069, Wilting #D4A843, Dying #C45B3E

Dark mode:
- Background: #121210, Surface: #1C1C1A, Surface Raised: #252522
- Border: #363630, Text Primary: #EDEDEA, Accent: #4CAF6E

### Spacing (4px grid)
4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80

### Type Scale (Inter)
Display 32/700, Title1 24/600, Title2 20/600, Title3 17/600, Body 15/400, Caption 13/400, Small 11/500

### Border Radius
sm: 6, md: 10, lg: 16, xl: 24, full: 9999

### Motion
Fast: 150ms, Normal: 250ms, Slow: 400ms, Easing: ease-out

---

## Phase Plan

### Phase 1: Foundation (COMPLETED)
- [x] Create PLAN.md
- [x] Expo project setup with TypeScript strict
- [x] Install dependencies
- [x] Design tokens + theme system
- [x] Font loading (Inter)
- [x] Responsive navigation shell
- [x] Database connection + migrations
- [x] Core schema creation
- [x] Repository layer
- [x] Streak engine (pure functions)
- [x] Streak engine tests (100% pass)
- [x] Verify web + native both run

### Phase 2: Garden & Plants (COMPLETED)
- [x] Create interactive SVG components for plants
- [x] Design growth stages (seed -> sprout -> sapling -> young_tree -> mature_tree -> grove)
- [x] Connect garden UI to habit data via Zustand / Context
- [x] Render the Garden tab showing active habits

### Phase 3: Exercises & Routines (COMPLETED)
- [x] Create UI for tracking timer and count-based exercises
- [x] Implement routine builder
- [x] Log exercise activities directly to the global ActivityLog

### Phase 4: Tasks, Schedule & Reminders (COMPLETED)
- [x] Tasks table and repository.
- [x] Tasks tab UI with day/week views (simplified pending groups for MVP).
- [x] Notifications/Reminders integration (`expo-notifications`).
- [x] Task detail and editing UI.

### Phase 5: Focus tracker, Insights, Weekly review (COMPLETED)
- [x] Focus session tracker UI (timer/stopwatch).
- [x] Log focus to ActivityLog.
- [x] Insights & Weekly review charts UI.

### Phase 6: Reading tracker, Learning roadmaps (COMPLETED)
- [x] Book and roadmap repositories.
- [x] Library tab UI (books list, roadmaps list).
- [x] Book detail screen (progress, notes).
- [x] Roadmap detail screen (steps, completion).

### Phase 7: RSS Reader & Content ingestion (COMPLETED)
- [x] RSS/Atom feed parser engine (pure module, handles both formats + CDATA).
- [x] OPML import/export support.
- [x] Feed and Article repositories (CRUD, search, read/saved states).
- [x] Feed fetching service with CORS proxy fallback for web.
- [x] Feeds tab UI (article list, feed management, search, view modes).
- [x] Article reader view (clean typography, save/bookmark, open in browser).
- [x] Feed parser unit tests (RSS 2.0, Atom 1.0, OPML round-trip).
- [x] Integrated into tab navigation.

### Phase 8: Polish, Search & Export ← CURRENT
- [ ] Global search across all entities.
- [ ] JSON export/import for data portability.
- [ ] Dark/light mode toggle.
- [ ] Onboarding flow.
- [ ] Accessibility improvements.

(populated as we go)
