# Grove App Implementation Audit

## 1. Summary
| Category | Total | DONE | PARTIAL | STUB | MISSING |
| --- | --- | --- | --- | --- | --- |
| Architecture | 5 | 5 | 0 | 0 | 0 |
| Garden & Streaks | 9 | 4 | 1 | 0 | 4 |
| Exercise Tracker | 8 | 5 | 1 | 0 | 2 |
| Reading Tracker | 5 | 3 | 1 | 0 | 1 |
| RSS Reader | 8 | 7 | 0 | 0 | 1 |
| Tasks & Reminders | 8 | 3 | 2 | 0 | 3 |
| Learning Roadmaps | 7 | 2 | 2 | 0 | 3 |
| Focus Tracker | 4 | 4 | 0 | 0 | 0 |
| Dashboard & Insights | 2 | 1 | 1 | 0 | 0 |
| Quality-of-Life | 8 | 0 | 2 | 0 | 6 |
| UI/UX | 3 | 1 | 1 | 0 | 1 |
| Performance | 4 | 0 | 1 | 0 | 3 |
| Testing | 3 | 1 | 0 | 0 | 2 |
| **Total** | **74** | **29** | **12** | **0** | **33** |

## 2. Detailed Checklist & Evidence

### Architecture
- [x] **Local-first storage:** DONE. (`src/db/provider.tsx`, expo-sqlite)
- [x] **Repository layer:** DONE. (`src/db/repositories/*.ts`)
- [x] **Migrations:** DONE. (`src/db/connection.native.ts` handles user_version updates)
- [x] **ActivityLog as source of truth:** DONE. (`src/db/repositories/activity-log.ts`)
- [x] **Streak engine as pure module:** DONE. (`src/engine/streak.ts`)

### Garden & Streaks
- [x] **Plant stages (seed to grove):** DONE. (`src/components/garden/Plant.tsx`)
- [x] **Health states:** DONE. (Thriving, ok, wilting, dying supported)
- [x] **One-miss-drops-one-level:** DONE. (`src/engine/streak.ts` calculates consecutive misses)
- [~] **2-extra-days recovery:** PARTIAL. Logic exists in streak engine, but UI does not explicitly visualize "recovery mode".
- [ ] **Rest tokens:** MISSING. Repo exists but no UI to earn or apply them.
- [ ] **Forest view:** MISSING.
- [ ] **Streak calendar heatmap:** MISSING.
- [ ] **Longest/current streak UI:** MISSING. (Computed but not surfaced in UI fully)
- [ ] **Reduced-motion support:** MISSING.

### Exercise Tracker
- [x] **Custom exercises:** DONE. (`app/exercise/[id].tsx`)
- [~] **Timer mode:** PARTIAL. Works in foreground, but does not use timestamps to remain perfectly accurate if backgrounded/suspended (`app/routine/[id].tsx`).
- [x] **Count mode:** DONE.
- [x] **Rest timer:** DONE.
- [x] **Routines:** DONE.
- [x] **History:** DONE. (Logged to ActivityLog)
- [ ] **Personal bests:** MISSING.
- [ ] **Progress charts:** MISSING.

### Reading
- [x] **Books with status/progress/rating/notes/quotes:** DONE. (`app/book/[id].tsx`)
- [x] **Bookshelf UI:** DONE. (`app/(tabs)/library.tsx`)
- [~] **Yearly stats:** PARTIAL. ActivityLog exists, but no specific yearly stats view.

### RSS Reader
- [x] **Add/remove feeds:** DONE. (`app/(tabs)/feeds.tsx` + `src/engine/feed-service.ts`)
- [x] **RSS and Atom parsing:** DONE. (`src/engine/feed-parser.ts` — handles both formats, CDATA, entities)
- [x] **Reader view:** DONE. (`app/reader/[id].tsx` — clean typography, paragraph rendering)
- [x] **Read/saved states:** DONE. (Toggle read/saved, filtered views)
- [x] **Search:** DONE. (Full-text search across title, summary, content)
- [ ] **OPML import/export:** PARTIAL — parser exists but no UI to trigger it yet.
- [x] **Web proxy:** DONE. (Uses allorigins.win CORS proxy on web)
- [x] **Graceful degradation:** DONE. (Web uses proxy, native fetches directly)

### Tasks, Schedule, Reminders
- [~] **Priorities:** PARTIAL. Priority field exists but UI doesn't visually sort or group by it powerfully.
- [ ] **Tags:** MISSING.
- [ ] **Subtasks:** MISSING.
- [ ] **Recurrence:** MISSING.
- [x] **Day/week agenda:** DONE. (`app/(tabs)/tasks.tsx`)
- [x] **Local notifications:** DONE. (`src/engine/notifications.ts`)
- [~] **Rescheduling after edits:** PARTIAL. Updating a task currently does not correctly cancel the old notification and schedule a new one in the UI handler.
- [ ] **Quick-add parsing:** MISSING.

### Learning Roadmaps
- [~] **Seed data imported once without overwriting:** PARTIAL. The `seed.ts` script inserts without checking for existing roadmaps.
- [~] **Track > Section > Topic > Subtopic:** PARTIAL. Subtopics are omitted from the seed parsing script.
- [ ] **Completion math:** MISSING (no deep aggregation logic).
- [ ] **Target-role filtering:** MISSING.
- [ ] **Editability:** MISSING (no UI to edit roadmap definitions).
- [ ] **Resource links:** MISSING (in DB schema but not rendered in UI).
- [x] **Waters the correct plant:** DONE. (`app/roadmap/[id].tsx`)

### Focus Tracker
- [x] **Countdown / Stopwatch:** DONE. (`app/focus.tsx`)
- [x] **Category tag:** DONE.
- [x] **Post-session rating:** DONE.
- [x] **Insights:** DONE. (`app/insights.tsx`)

### Home & Quality-of-Life
- [~] **Home (Today) screen:** PARTIAL. Currently a stub/placeholder with "Quick Actions".
- [x] **Insights and weekly review:** DONE.
- [ ] **Global search:** MISSING.
- [ ] **JSON export/import:** MISSING.
- [ ] **Dark/light theme:** MISSING (Theme provider exists but no toggle).
- [ ] **Command palette & shortcuts:** MISSING.
- [ ] **Onboarding:** MISSING.
- [~] **Empty/loading/error states:** PARTIAL. Exists on some screens (Library), missing on others.

### UI/UX & Performance
- [x] **Design tokens:** DONE.
- [~] **Responsive layouts:** PARTIAL. Works but not optimized for tablet/desktop sidebars.
- [ ] **Accessibility:** MISSING (aria-labels, focus states).
- [~] **List virtualization:** PARTIAL (Uses ScrollView.map instead of FlatList).
- [ ] **Indexes:** MISSING (No DB indexes created in schema).
- [ ] **Lazy loading:** MISSING.

### Testing
- [x] **Unit tests:** DONE (Streak engine tested).
- [ ] **Component tests:** MISSING.
- [ ] **Playwright E2E:** MISSING.

---

## 3. Test and Build Results
- **Type-check (`npm run typecheck`)**: PASSED. 0 errors.
- **Lint (`npm run lint`)**: FAILED. Missing `eslint.config.*` for ESLint v9+.
- **Unit Tests (`npm run test`)**: PASSED. 2 test suites, 110 tests passed (26s). Covers streak engine + feed parser.
- **Playwright E2E**: MISSING. Not implemented.
- **Prod Build**: UNTESTED.

## 4. Prioritized Bugs & Gaps
**Critical**
1. ~~Timer backgrounding (must use timestamps)~~ (FIXED)
2. ~~Task notification rescheduling (canceling old notification before setting a new one)~~ (FIXED)
3. ~~Seed logic idempotency (currently inserts duplicates)~~ (FIXED)
4. ~~List virtualization (`FlatList` instead of `ScrollView`)~~ (FIXED)

**High**
1. RSS Reader implementation (Phase 7)
2. Global search and JSON export/import (Phase 8)
3. Recurrence for tasks
4. Roadmap subtopics & target-role filtering

**Medium**
1. Dark/light mode toggle
2. UI Accessibility
3. Database indexes

**Low**
1. Onboarding
2. Detailed stats views

## 5. Not Verified
- Native Local Notifications (tested via console mock on web, needs real iOS/Android device)
- Heavy database migrations edge cases
- OS-level Dark Mode transitions
