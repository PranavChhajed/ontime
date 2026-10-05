# Part C3 — Implementation Plan
**Punctuality Scoring System — "OnTime" web app, version 1**
Version 1.0 · 5 Oct 2026

Reads with: C2 PRD (what the app does), C1 (decisions), Parts A and B
(rules). This document says **how** it is built and **in what order**.
Nothing here has been built yet.

---

## C3.1 Stack

| Layer | Choice | Reason |
|---|---|---|
| App | **Next.js** (App Router) + **TypeScript** | One codebase for phone and PC; server-side writes keep rules out of the browser |
| Styling | **Tailwind CSS** | Fast to match a supplied design; mobile-first by default |
| Animation | **Motion** (`motion/react`) | Onboarding and sheet transitions; respects reduced-motion settings |
| Database | **Postgres on Supabase** | Real constraints and triggers, so rules and history are enforced in the database, not only in screens |
| Sign in | **Supabase Auth**, email + password | Several Admin accounts with no extra service |
| Hosting | **Vercel** | Simple deploys; preview link for each change |
| Tests | **Vitest** | The scoring rules are pure functions; they need fast table-driven tests |

The data is small: about 20 employees × 31 days ≈ 600 rows a month.
Nothing here needs queues, caches or background jobs.

**Fixed settings (code, not screens)**

| Setting | Value |
|---|---|
| Reporting time | 9:30 |
| Band edges | ≤ 9:30 · 9:31–9:34 · 9:35–9:40 · ≥ 9:41 |
| Late-notice cut-off | none (slot kept, B3.14 #16) |
| Monthly method | `pooled` (switch kept, C1.2.1) |
| Time zone | `Asia/Kolkata` (factory is in India) |

---

## C3.2 Project layout

```
src/
  scoring/          pure rules, no database, no UI
    classify.ts       arrival minute → category
    notice.ts         notice minute + arrival minute + category → outcome
    day.ts            one day → category, points, explanation sentence
    month.ts          all days of one employee → totals and percentage
    calendar.ts       is this date a working day for this employee?
    *.test.ts         tables from B1, B2, B3, B5, C1
  db/               queries and write actions
  app/              screens (C2 section 7.1)
supabase/migrations/  tables, constraints, triggers, policies
```

**Rule:** only `src/scoring` knows the rules. Screens and the database call
it; they never re-implement a band or a notice check.

---

## C3.3 Scoring engine

### Inputs and outputs

```
scoreDay(day, pointValues) →
  { kind:  'on_time' | 'band_931_934' | 'band_935_940' | 'after_940'
         | 'leave' | 'non_working' | 'not_employed' | 'needs_attention',
    categoryPoints, noticeOutcome, noticePoints, dayPoints,
    inBase: boolean,
    explanation: string }

scoreMonth(days[], pointValues) →
  { counts per category, noticePoints, totalPoints,
    workingDays, leaveDays, attendedDays, baseRequirement,
    scorePercent: number | null }        // null = "No score"
```

### Decisions inside the engine

| Point | Rule |
|---|---|
| Times | Stored and compared as **minutes after midnight** (9:30 = 570). Seconds never exist, so nothing is ever rounded up |
| Day order | Not employed → holiday / weekly off → leave → no arrival (needs attention) → band (B1.10) |
| Notice | Only for the two eligible bands; `notice < arrival` required; `≤ 570` = by 9:30, else late (B3.9) |
| Arithmetic | Points held as whole **hundredths** (6 → 600) so that 4.5 and 1.5 add exactly |
| Monthly score | `totalPoints ÷ (attendedDays × base)`; `attendedDays = 0` → `null` |
| Needs-attention days | Not in points, not in base, counted separately |
| Rounding | Half-up to one decimal, done once, at display |

### Tests (written before any screen)

| Source | What is tested |
|---|---|
| B1.15 | Every band edge; leave; holiday; nothing recorded |
| B3.12, B3.11 | Every notice case, including same minute, after arrival, not eligible |
| B2.7 | All 9 valid day outcomes |
| B2.14, B3.11, B5.11, A1.6 | Every month illustration, to one decimal |
| B5.8 | Adding leave or holidays leaves the score unchanged |
| C1.2.1 | Leave week + one late day = 114.3% |
| C1.2.2 | Joiner / leaver: days outside employment change nothing |
| C1.1 #11 | All-leave month → "No score" |
| C1.4 #1 | Arrived 9:47, informed 9:22 → 1.5 (not 3.5) |
| B2.16 | Changing a point value changes results accordingly |

---

## C3.4 Data model

All dates are plain dates; all times are minutes after midnight.

| Table | Main columns | Notes |
|---|---|---|
| `approved_emails` | email, added by, added when | Who may be an Admin. First row added by the developer |
| `admins` | user id, email, name | Created when an approved email signs up |
| `employees` | id, name, counted_from, last_working_date | "Remove" sets `last_working_date` |
| `employee_weekly_offs` | employee, weekday, from_date, to_date | Dated, so changing the usual off never rewrites past months |
| `day_overrides` | employee, date, kind (`off` / `working`) | One-date change to the weekly off |
| `holidays` | date, name | Company-wide |
| `day_records` | employee, date, status (`arrived` / `leave` / none), arrival_minute, notice_minute | **One row per employee per date** |
| `point_values` | base, on_time, band_931_934, band_935_940, after_940, leave, notice_by_930, notice_late | One current row |
| `months` | month, status (`open` / `closed`), saved point values, saved results | Filled at close |
| `change_log` | what, which record, employee, date, field, old, new, when, who | Append-only |

### Rules enforced by the database itself

| # | Rule | How |
|---|---|---|
| 1 | One record per employee per day | Unique (employee, date) |
| 2 | One arrival, one notice per day | They are single columns |
| 3 | Never both leave and arrival | Check: `arrived` ⇔ arrival time present; `leave` ⇒ no arrival time |
| 4 | Times are valid minutes | Check 0–1439 |
| 5 | No writes into a closed month | Trigger on day records, holidays, overrides |
| 6 | History cannot be skipped or edited | Trigger writes `change_log` on every insert / update / delete; no update or delete allowed on the log |
| 7 | Only Admins read or write anything | Row-level policy: signed in **and** email still in `approved_emails` |
| 8 | Only approved emails can create an account | Sign-up is refused in the database for any other email |

### Open and closed months

| State | Point values used | Results come from |
|---|---|---|
| Open | Current `point_values` | Calculated live from day records ("Provisional") |
| Closed | Values saved at first close | Saved results |
| Reopened | Values saved at first close (C1.3 #3) | Calculated live; saved again on re-close |

Closing checks, in order: the month has ended; no needs-attention days for
any employee. Close, reopen and re-close each write a history line.

---

## C3.5 How a write flows

```
Admin taps Save on a day
   → server action checks: signed-in Admin, month open, date not in future
     (for arrival), employee employed and working that day
   → writes day_records
   → database trigger adds change_log lines (old → new, when, who)
   → screen re-reads the day and shows the engine's result line
```

The live result line while typing uses the **same** engine code in the
browser, so what the Admin sees before saving is what is stored after.

---

## C3.6 Build order: four checkpoints

Work stops at each checkpoint. The owner reviews, and the next phase starts
only after approval. Inside a phase the steps are done in order.

All Admins share **one database**: employees, calendar, records, point values
and history are the same for everyone who signs in. Nothing is stored per
Admin or on the phone.

### Checkpoint 1: Rules and look (no database, nothing to sign in to)

**Status: built, awaiting owner review.**

| Work | Done when |
|---|---|
| Project set up; design tokens, fonts and base components from `docs/guidelines/DESIGN.md`, adapted for phone | App runs locally on a phone-sized screen |
| Scoring engine and every test in C3.3 | All tests pass; the owner can read the list of tests against the rule tables |
| **Onboarding page** with its animation | Smooth on a phone; can be skipped and replayed |
| **Today screen shown with sample data** (in memory only) | The arrival-entry flow, result line and look can be judged by tapping through it |

**Owner reviews:** the feel of the design, the onboarding animation, and
whether the arrival-entry flow is fast enough. Changing course here is cheap
because nothing is wired to a database yet.

### Checkpoint 2: Real daily use

| Work | Done when |
|---|---|
| Database tables, constraints, history triggers, access rules | A leave + arrival row is refused; an edit leaves a history line; a signed-out request gets nothing |
| Sign-in / create account by approved email | Approved email gets in; any other is refused |
| Employees (add, edit, remove, counted-from, weekly offs) | An employee added on one device appears on another |
| Month calendar: holidays and one-date overrides | Working days per employee match a hand count |
| Today screen wired to the database | 20 employees recorded on a phone in about 3 minutes |

**Owner reviews:** the daily loop with real saves, on a real phone, for a
few days of pretend data.

### Checkpoint 3: Results and month close

| Work | Done when |
|---|---|
| Results list and employee breakdown | Percentages match a hand calculation on the same data |
| Needs-attention list | Every unrecorded past working day is listed and fixable in two taps |
| Close, reopen, re-close | Closing is refused with a gap; a closed month refuses edits; reopen is logged |

**Owner reviews:** a whole pretend month from first entry to closed result,
and the explanation screen for a score.

### Checkpoint 4: Finish and go live

| Work | Done when |
|---|---|
| Point values screen with history | A change alters open months only; closed months unchanged |
| Approved emails screen, history screen, onboarding replay | Removing an email ends that person's access at once |
| Phone and PC polish, empty and error states | Checks in C3.7 pass |
| Deploy to Vercel | The live address works on a phone |
| Trial month beside Excel | Differences explained (pooled vs weekly average, C1.2.1) |

**Owner reviews:** the live app, then decides when the Excel sheet stops.

### Checkpoint 4 progress

**Status: screens built and verified locally; deployment waits for the owner's approval.**

| Item | State |
|---|---|
| Point values (`/more/points`): edit all 8 values, validation, soft warnings, past changes | Done. Verified live: changing "On time" 6 to 5 moved October (Raja 120.0% to 100.0%), left closed September unchanged, and was logged with who and when. Value restored to 6 afterwards |
| Admin access (`/more/access`): add and remove approved emails | Done. Database now refuses removing your own email and removing the last email (migration 8; tested, rolled back) |
| History (`/more/history`): every change in words, filters, "show older" | Done. Month close/reopen entries now carry the month (migration 9) |
| Results footer and score bar followed a hard-coded 120% | Fixed: they follow the month's real on-time value |
| Onboarding replay | Already in More |
| Phone and PC | New screens: 0 contrast failures, 0 overflow at 390 and 320 px; PC shows the same centred column |
| Automated tests | 268 (new screens, history wording, access rules) and axe on every new screen |
| Go-live guide | `Go_Live_Guide.md` |
| Deploy to Vercel | Approved by the owner, but the Vercel connection cannot create projects (403). Owner runs 5 commands from `Go_Live_Guide.md` section 1. Production build passes (`next build`) |
| Trial month beside Excel | Owner |

Known limitation: the welcome tour's example numbers (6 / 4.5 / 2 / 0) are the documented defaults and do not follow edited point values.

### Checkpoint 2 progress

**Status: complete and verified in the real app with the owner's account.**

| Item | State |
|---|---|
| Informed section on Today (owner request) | Done |
| Phone could not use the dev server | Fixed (`allowedDevOrigins`) |
| Supabase project `ontime` (Mumbai, free plan) | Live; migrations 1-5 applied (`supabase/migrations/`) |
| First approved Admin email | `pranavc8482@gmail.com`; account confirmed and signed in |
| Database rules | Tested as Admin and as a removed Admin: 22 checks pass; refuses signed-out callers |
| Sample data (4 employees, ~5 weeks, 1 holiday) | In the database, kept until the app is finished (`supabase/seed/`) |
| Sign-in, Today (Arrivals + Informed), Employees, Month calendar | Exercised for real: saves, undo, history with who, delete rules, holiday and weekly-off changes |
| Automated tests | 162 pass (rules, calendar, weekly-off summary, India clock, Today / Employees / Month screens) |
| Bugs found and fixed during testing | Undo restoring onto the wrong date; weekly-off summary mixing old and new; edit sheet showing a stale weekly off; locale-dependent date text; noisy history; truncated "informed" times; "0 of 0 recorded" on holidays; slow-feeling calendar taps (now instant) |
| Not exercised | Sign-out button (would end the owner's session) |

### Audit before Checkpoint 4

A full audit of Checkpoints 1-3 found and fixed 14 issues (the most important: **Now** could record a stale minute at the 9:30/9:31 boundary). See `QA_Report_Checkpoints_1-3.md`. 248 tests, 0 accessibility violations, 0 contrast failures, 0 production vulnerabilities.

### Checkpoint 3 progress

**Status: built and verified in the real app with the sample data. Awaiting owner review.**

| Item | State |
|---|---|
| Results list (`/results/2026-10`): score, attended days, bar with a 100% mark, month navigation | Done |
| Employee breakdown: points ÷ base arithmetic, counts per category, working → attended days, every date with its sentence, edit history with who | Done |
| Needs-fixing list: unrecorded past days and conflicting records, fixed in one tap (On leave / Clear record) or two (Enter time / Edit), with Undo | Done |
| Close, reopen, re-close (`close_month` / `reopen_month`): month must have ended, frozen results and point values, locked edits, history of each step | Done; shown on both Month and Results screens |
| Scores checked against an independent SQL hand calculation of September | Match exactly (112.8%, 97.2%, 104.0%, 97.5%) |
| Database checks for close / reopen | 12 pass (rolled back) |
| Automated tests | 205 pass |
| Sample data state | September left **closed** to show the closed state (reopen from its card); October has two days needing fixing for Anil |

Decisions made while building (all reversible): a month's score is "so far" until it is closed; days after today are left out of a provisional score; today's unrecorded people are not "needing a fix" until the day is over; a record on a day off is treated as a conflict that blocks closing; closed months show the frozen results while open ones are calculated live; a reopened month stays on the point values saved at its first close.

### What is needed from the owner, and when

| When | What |
|---|---|
| Before Checkpoint 2 | **One email to approve.** Approval to create a Supabase project in your account (I will show the plan and cost first) |
| Before Checkpoint 4 | Approval to create the Vercel project and deploy |
| Any time | Design changes you want after Checkpoint 1 |

Nothing is needed for Checkpoint 1.

---

## C3.7 Checks before go-live

- All engine tests pass.
- Phone check on a small screen: Today, day entry, breakdown.
- Two Admins editing the same day: the later save wins and both values
  are in history.
- A month closed, reopened, corrected and re-closed; history shows all of it.
- A full copy of the data can be exported (C3.8 #3).

---

## C3.8 Risks

| # | Risk | Handling |
|---|---|---|
| 1 | Typing 20 times on a phone is slow | "Now" button; rows stay on one screen; measured in step 5 |
| 2 | Admin forgets a day | Needs-attention list; closing is blocked |
| 3 | Data loss on the hosted database | Check the backup offered by the chosen plan; add a monthly export of all records regardless |
| 4 | App and Excel disagree in the trial month | Expected for the reason in C1.2.1; the breakdown screen shows the arithmetic |
| 5 | Owner later decides the Open items (system failure, cut-off, incentives) | Engine has one place for each: a day kind, a notice setting, a step after `scorePercent` |
| 6 | Phone clock is wrong when "Now" is used | "Now" uses the server's time in the factory time zone, not the phone's |

---

## C3.9 Needed from the owner

| # | Item | Needed by step |
|---|---|---|
| 1 | Go-ahead to start building | 0 |
| 2 | Factory time zone | **Received:** India |
| 3 | Which Supabase and Vercel accounts to use | **Received:** the owner's own |
| 4 | One email to approve first (the developer's or the Admin's) | Go-live only; not needed to build |
| 5 | Employee list | **Not needed.** Entered by the Admin in the app |
| 6 | Visual design | **Received:** `docs/guidelines/DESIGN.md` (style reference) plus the UX brief in `docs/guidelines/CLAUDE.md` |
| 7 | Holidays for the first month | **Not needed.** Entered by the Admin in the app |
