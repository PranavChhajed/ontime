# OnTime — Punctuality Scoring web app

Phone-first, Admin-only web app that replaces a factory's "Punctuality-Arrival"
Excel sheet. The Admin records arrival time, notice time and leave per employee
per day; the app produces one monthly punctuality percentage per employee,
traceable to each day.

**Status:** Checkpoints 1-3 are complete, verified and audited (see the QA report).
Checkpoint 4 is built and tested locally: Point values, Admin access, History,
Go-live guide. Deployed at https://ontime-rose.vercel.app (code: private repo
PranavChhajed/ontime). Not yet done: Supabase Site URL / Redirect URL (owner),
the trial month beside Excel (owner). See `planning/C3_Implementation_Plan.md` C3.6 and
`planning/Go_Live_Guide.md`.

**Commands:** `npm run dev` (http://localhost:3000) · `npm test` (scoring
tests) · `npx tsc --noEmit` · `npx eslint src` · `npx next build`.

**Next.js here is v16 with breaking changes.** Read the relevant guide in
`node_modules/next/dist/docs/` before writing Next-specific code (see
`AGENTS.md`).

## Documents (read before changing anything)

| File | What it is |
|---|---|
| `docs/SYSTEM.md` | Part A: overview, principles, workflow |
| `docs/B1_Day_Classification_Rules.md` | Day categories and time bands |
| `docs/B2 — Points Table.md` | All point values |
| `docs/B3_Notice_Rules.md` | Notice (inform) rules |
| `docs/B5_Neutral_Rules.md` | Leave, holidays, weekly offs |
| `docs/planning/C1_Open_Decisions.md` | Decisions that fill the gaps in A/B; off things found |
| `docs/planning/C2_PRD.md` | What the app does, screen by screen |
| `docs/planning/C3_Implementation_Plan.md` | Stack, data model, engine, tests, build order |
| `docs/planning/QA_Report_Checkpoints_1-3.md` | What was tested before Checkpoint 4 and the bugs fixed |
| `docs/planning/Go_Live_Guide.md` | Deploy steps, dashboard settings, trial month beside Excel |
| `docs/guidelines/DESIGN.md` | Visual style reference (colours, type, radii) |
| `docs/Happy Sal;ary Calculation 2.10.26.xlsx` | Reference only; only the `Punctuality-Arrival` sheet is relevant |

**Precedence:** B documents > Part A > C1 (gaps only) > Excel. Excel is never
the specification; its known gaps (SYSTEM.md A4.5) must not be copied.

## Scope guardrails

- **Not in version 1:** OT, incentives, employee login, half-day leave, holiday
  work, a "system failure" status, late-notice cut-off, attendance import,
  weekly figures. Do not build these; keep the slots described in C3.
- Exactly five day categories. Do not add a sixth.
- One user type: Admin (several accounts, equal rights). English only.

## Rules that are easy to get wrong

- Times are judged by the **minute**; never round up. Store as minutes after
  midnight (9:30 = 570).
- Bands: ≤ 9:30 on time (6) · 9:31–9:34 (4.5) · 9:35–9:40 (2) · ≥ 9:41 (0).
- Notice points only on the 9:35–9:40 and After-9:40 bands, and only if the
  notice minute is **before** the arrival minute: ≤ 9:30 → +1.5, else +1.
- Notice time is kept on the record even when it earns 0.
- Leave is checked before arrival; a day is never both leave and arrived.
- Monthly score = total points ÷ (attended days × base), **one pooled ratio**
  (not the Excel weekly average). Zero attended days → "No score".
- A working day with nothing recorded is "Needs attention": out of points and
  base, and it blocks closing the month. It is never scored as late.
- Days outside an employee's counted-from / last working date behave like
  weekly offs. "Counted from" defaults to the day the employee is added.
- Display to one decimal, rounded half-up, once, at display.
- The docs' example "arrived 9:47, informed 9:22 = 3.5" is wrong; it is 1.5.
- Point values are Admin-editable; band edges are not.
- Every change keeps old value, new value, when and who. Nothing is overwritten
  silently; closed months keep the point values they were closed with.

## Stack and conventions

- Next.js (App Router) + TypeScript, Tailwind, Supabase (Postgres + Auth),
  Vercel, Vitest.
- All rule logic lives in `src/scoring` as pure functions. Screens and database
  code call it and never re-implement a band or notice check.
- Engine tests come from the tables in B1.15, B2.7, B2.14, B3.11, B3.12, B5.11
  and C1; write them before screens.
- Integrity rules (one record per day, no leave + arrival, closed-month lock,
  append-only change log) are enforced in the database, not only in the UI.
- Follow the build order in C3.6. Mobile layout first.

## Design and UX (owner's brief)

- Design as a UI/UX specialist who knows factory admins: busy, interrupted,
  using a phone on the floor, many times a day. Low friction beats everything.
- The most frequent action is **logging one person's arrival time**. It must be
  the fastest, most obvious thing in the app: fewest taps, large touch targets,
  nothing to read first.
- Every screen must be easy to understand and easy to act on without training.
- **Onboarding page:** very simple, with excellent animation — the visual high
  point of the app. It explains only the basic purpose and the basic steps.
- `docs/guidelines/DESIGN.md` is a **style reference**, not a layout to copy. It
  describes a spacious marketing site. Take its palette, typefaces, radii and
  calm tone; adapt sizes and spacing for a dense phone tool.
- **If the style reference hurts usability, usability wins.**
- Fonts in use: **Fraunces** (display; reaches weight 200-300, Playfair
  cannot) and **Inter** (UI). Colours are Tailwind tokens in
  `src/app/globals.css` (`cream`, `linen`, `ink`, `sand`, `olive`,
  `chartreuse`, `terracotta`, `clay`, `brick`). `clay` and `brick` are derived
  warm tints for late-band status.
- Terracotta fill is for the primary action only, with **ink** text (white on
  terracotta fails contrast). On the olive panel use chartreuse buttons, never
  terracotta.
- Known adaptations: display type scaled down for phones; card padding and
  section gaps reduced; free substitutes for the licensed fonts (Playfair
  Display, Inter); text on terracotta checked for contrast; status colours
  drawn from the warm palette (no blue), never chartreuse as text.

## Data and access notes

- First (only) approved Admin email: `pranavc8482@gmail.com`. Sign-up is
  refused for any other email. If the confirmation email does not arrive
  (Supabase's built-in sender is unreliable on new projects), the developer can
  confirm the account in the database after the owner has signed up.
- **Sample data stays until the app is completely developed** (owner's
  instruction): two `Sample ...` employees (Anil, Suresh; owner cut it from four), a sample holiday, about five
  weeks of records. See `supabase/seed/`. Do not delete them early; remove with
  `supabase/seed/remove_sample_data.sql` only when the owner says so.

- Supabase URL and publishable key are in `.env.local` (git-ignored). The
  publishable key is safe in the browser; all tables are closed to everyone but
  signed-in, still-approved Admins by row-level rules in the database.
- Schema lives in `supabase/migrations/` (apply in order). Never touch the
  owner's other Supabase projects (VaaniTrack, Reckon, supabase-orange-park).
- The browser talks to Supabase directly; rules are enforced by the database
  (triggers, checks, row-level rules), not only by screens.
- "Now" and "today" come from the server's clock converted to India time, never
  the phone's clock (`useClock` in `src/data/queries.ts`).
- "Now" must be read from the clock at the moment of the tap (`getNow()`), never from a value captured at render: 9:30 vs 9:31 decides 6 vs 4.5 points.
- Long names must never overflow: headings break anywhere (`h1,h2,h3 { overflow-wrap: anywhere }`), list names truncate.
- Do not type credentials into the sign-in form while testing in the browser
  pane: the form posts to a remote host. The owner signs in themselves.
- Onboarding shows once (`localStorage` key `ontime.onboarded`), is skippable,
  and can be replayed from More.
- The desktop app's browser preview runs animations at about 2 fps; judge
  smoothness on a real phone.

## Working with the owner

- Question anything that looks off and give a reason for each decision.
- Ask before proceeding when a rule is ambiguous; record the answer in C1.
- Factory is in India: time zone `Asia/Kolkata`.
- Use the owner's own Supabase and Vercel accounts.
- Access is by approved email: the developer approves the first one, Admins
  approve the rest. Sign-up is refused for any other email.
- The app starts empty and needs no data loaded beforehand; the Admin enters
  employees, weekly offs and holidays in the app.
