# Part C2 — Product Requirements Document
**Punctuality Scoring System — "OnTime" web app, version 1**
Version 1.0 · 5 Oct 2026

---

## 1. Summary

OnTime is a phone-first web app that replaces the "Punctuality-Arrival"
Excel sheet. The Admin records each employee's arrival time, notice time
and leave, day by day. The app applies the rules in Parts A, B1, B2, B3 and
B5 and gives every employee one number per month: a **punctuality
percentage**, which can be traced back to each day.

This document says **what** the app does. **How** it is built is in
C3 Implementation Plan. The **rules** stay in Parts A and B; decisions that
filled their gaps are in C1.

---

## 2. Contacts

| Role | Who | Part in this project |
|---|---|---|
| Owner | *(to fill)* | Owns the rules; decides the Open items in C1.5 |
| Admin(s) | *(to fill)* | Daily users of the app; record and correct everything |
| Developer | *(to fill)* | Builds the app from this document set |
| Designer | *(to fill)* | Supplies the visual design, matched to section 7.1 |

---

## 3. Background

- A factory with about 20 employees and a 9:30 AM reporting time scores
  punctuality every month. The score will later decide incentives.
- Today this is done by hand in Excel. The sheet stores only **weekly
  counts**, so nobody can say which dates produced a score.
- The sheet also allows mistakes the rules forbid: notice points on days
  that cannot earn them, blank days counted as very late, and point values
  changed with no record (SYSTEM.md A4.5).
- **Why now:** the rules were reviewed and written down (Parts A and B) and
  the remaining gaps were settled (C1). The rules are stable enough to
  build on.

---

## 4. Objective

**Objective:** give the Admin a simple tool that turns daily facts into a
monthly percentage that is correct, neutral and explainable.

**Why it matters:** the score will decide money. A wrong or unexplainable
score damages trust; a missing record must never look like lateness.

**Key results (targets for version 1)**

| # | Key result | How it is checked |
|---|---|---|
| 1 | Every test table in B1.15, B3.12, B2.14, B3.11 and B5.11 gives the documented answer | Automated tests, 100% pass |
| 2 | Any monthly percentage can be traced to its daily records in the app | Employee breakdown screen shows every day and how it was decided |
| 3 | Recording one day for 20 employees takes the Admin about 3 minutes on a phone | Timed with the Admin before go-live |
| 4 | No change to a record or a point value is ever lost | Every edit appears in the history with old value, new value, when and who |
| 5 | The Excel sheet is no longer needed after the first full month | Admin confirms |

---

## 5. Users

There is one kind of user: the **Admin**.

| Point | Detail |
|---|---|
| Who | One or more people who record attendance for the factory |
| Their job | Record times and leave, keep the calendar right, close the month, explain a score when asked |
| Device | **Phone first**; PC also supported |
| Language | English |
| Skill | A factory admin, not a technical user (principle "Simple", A2.5) |

**Employees do not use the app.** They are scored, and the Admin shows or
tells them their result.

**Constraints**
- One factory, one time zone.
- Entry is manual in version 1.
- All Admins have the same full control. A separate Owner role may come
  later.

---

## 6. Value

| Admin's need | What the app gives | Excel pain removed |
|---|---|---|
| Record the day quickly | One screen per day, one row per employee | Counting days into weekly boxes by hand |
| Not have to work out categories | Category, notice outcome and points appear from the times | Admin decides the category and notice by hand |
| Explain a score | Day-by-day breakdown with a plain sentence per day | Scores cannot be traced to dates |
| Not hurt anyone by mistake | Leave, holidays, weekly offs and unrecorded days never lower a score | Blank day counts as very late |
| Fix a mistake safely | Edits allowed; old value stays visible | Old value is overwritten |
| Trust the result | Month is checked for gaps before it can be closed | Only a red cell warns of a mismatch |

---

## 7. Solution

### 7.1 Screens and flows

The app has **four main areas**, reached from a bottom bar on the phone:
**Today · Month · Results · More**.

#### Screen 0 — Onboarding
- Shown the first time an Admin signs in; can be replayed from More.
- Very short: the purpose of the app and the basic steps (record arrivals →
  the app scores each day → close the month → see the percentage).
- Carries the best animation in the app. Can be skipped at any point.
- No setup questions; it only explains.

#### Screen 1 — Sign in / Create account
- Email and password.
- **Access is by approved email.** Only an email on the approved list can
  create an account. Anyone else is told "This email has not been given
  access" and gets nothing.
- The developer approves the first email. After that, any Admin can approve
  or remove emails from the Admins screen (Screen 8).
- A new account confirms its email once, so nobody can claim an approved
  email that is not theirs.

#### Starting empty
- The app needs **no data loaded beforehand**. The Admin enters everything.
- Point values start at the documented values (5 / 6 / 4.5 / 2 / 0 / 0 /
  1.5 / 1).
- With no employees, Today shows one action: **"Add your first employee"**.
- Months are not "created"; a month exists as soon as its dates are used.

#### Screen 2 — Today (daily entry) — the main screen
The Admin spends most of their time here.

- Opens on **today's date**. The Admin can move to any other date.
- Shows a counter, for example **"14 of 18 recorded"**.
- One row per employee who is employed on that date.
  - Employees on their weekly off, or everyone on a holiday, are shown
    greyed with the reason, and cannot be edited.
- Two sections sit under the progress bar: **Arrivals** and **Informed**.
  - **Arrivals** is the list above. One tap on **Now** logs an arrival.
  - **Informed** lists every working employee with a clear yes / no: a
    tick and the time if they have informed, an empty circle if not. One tap
    on **Informed** records the notice at the current time (with Undo); tap a
    row to set a different time or mark "not informed". Someone who has
    already arrived gets **Add time** instead, because "now" is almost never
    right for them. The tab shows how many have informed.
  - Both sections edit the same day record; the Informed section is only a
    faster place to enter notice.
- Tapping an Arrivals row opens the **day entry** for that employee:

| Field | Behaviour |
|---|---|
| **Arrived** | Time, hours and minutes. A **"Now"** button fills in the current time |
| **Informed at** | Optional time. Can be entered **before** the arrival is known |
| **On leave** | Switch. Turning it on clears the arrival time (the old value stays in history) |
| **Result line** | Updates as the Admin types. See below |
| **History** | Earlier values of this day, if it was ever changed |

- **Result line examples** (the exact wording the rules ask for):
  - "Arrived 9:29 → On time = 6 points"
  - "Arrived 9:47, informed 9:22 → After 9:40 + informed by 9:30 = 1.5 points"
  - "Arrived 9:37, informed 9:37 → 9:35–9:40; notice not before arrival = 2 points"
  - "Arrived 9:33, informed 9:15 → 9:31–9:34; notice not eligible = 4.5 points"
  - "Marked by Admin: Approved leave → not in base"
- The Admin **never chooses** a category or a notice outcome.

**Typical flow, late employee:** employee phones at 9:22 → Admin opens the
row and enters "Informed at 9:22" → row shows "Informed, not arrived yet" →
employee arrives → Admin taps "Now" → row shows the result.

**Rules for this screen**
- An arrival time cannot be entered for a future date. Leave can.
- A day is either "arrived" or "on leave", never both.
- At most one arrival time and one notice time per day.

#### Screen 3 — Month
- A calendar of the chosen month.
- The Admin adds or removes **holidays** (company-wide) by tapping a date.
- Shows the month's state: **Open** or **Closed**.
- Shows **"Needs attention: N days"**. Tapping it lists every past working
  day with nothing recorded, by employee and date, each one tappable to
  fix.
- **Close month** button.
  - Allowed only when the month has ended and nothing needs attention.
  - On closing, the results and the point values in use are saved.
- **Reopen month** button on a closed month. Reopening and re-closing are
  recorded in history.
- A closed month is read-only until reopened.

#### Screen 4 — Results
- Pick a month. One row per employee:
  **name · percentage · attended days**.
- Open months are labelled **"Provisional"**.
- An employee with no attended days shows **"No score"**.
- Tapping a row opens the employee breakdown.

#### Screen 5 — Employee breakdown (one employee, one month)
This is the screen the Admin uses to explain a score.

- **Summary**
  - Count of days in each of the five categories
  - Notice points earned
  - Total points
  - Working days, leave days, attended days
  - Base requirement
  - **Monthly score (%)**
- **Day list:** every date of the month with its result line, or
  "Holiday", "Weekly off", "Not employed", "Needs attention".
- A changed day is marked; tapping shows what it was before, what it
  became, when, and which Admin.
- Can be printed or shared as a page.

#### Screen 6 — Employees (under More)
- List of employees, current and past.
- **Add / edit:** name, **counted from** date, last working date
  (optional), usual weekly-off weekday(s).
  - *Counted from* defaults to today. It is the first day the app scores
    this employee, not the day they joined the factory. Days before it are
    ignored, so starting the app mid-month never creates gaps.
  - *Weekly off* is seven weekday buttons (Mon–Sun); tap one or more.
    Sunday is pre-selected and can be changed.
- **Remove:** sets the last working date. Records are kept. A full delete
  is offered only for an employee with no records.
- **One-date override:** from the employee's month view, the Admin can
  turn a single date into a weekly off or back into a working day.
- Changing the usual weekly off applies **from a chosen date onward**; it
  does not rewrite past months.

#### Screen 7 — Point values (under More)
- Shows the eight values: base requirement, five category points, two
  notice points.
- The Admin can change any of them. A confirmation tells the Admin that
  the change applies to **all open months** and not to closed months.
- Below: the list of every past change (old, new, when, who).
- The time boundaries (9:30, 9:34, 9:40) are **not** editable; they are
  rules, not point values.

#### Screen 8 — Admins (under More)
- The approved-email list. Any Admin can approve a new email or remove
  one. Removing an email ends that person's access at once.
- An Admin cannot remove themselves if they are the last one.

#### Screen 9 — History (under More)
- One list of every change in the app, newest first, with filters by
  employee and by month.

### 7.2 Key features

| # | Feature | Source rule |
|---|---|---|
| F1 | One record per employee per day | A2.1, B1.13 |
| F2 | Category worked out from arrival minute; seconds never entered | B1.4, B1.5 |
| F3 | Notice outcome and points worked out from notice time and arrival time | B3.8, B3.9 |
| F4 | Notice time kept even when the day is not eligible; it earns 0 | B3.8 |
| F5 | Leave is a whole-day status set by the Admin, removed from the base | B5.5 |
| F6 | Company-wide holidays; weekly offs per employee, with one-date overrides | B5.6, C1.3 #1 |
| F7 | Monthly score = total points ÷ (attended days × base), one pooled ratio, shown to one decimal | C1.2.1 |
| F8 | A working day with nothing recorded is "Needs attention": left out of points and base, and blocks closing | C1.3 #4 |
| F9 | Month close, reopen, re-close; closed months read-only | A3.2, C1.1 #6 |
| F10 | Point values editable by Admin; closed months keep their saved values | B2.16, C1.3 #2–3 |
| F11 | Every change keeps old value, new value, when and who | B1.13.2, C1.3 #7 |
| F12 | Employees can be added, edited and removed; mid-month start and end dates are neutral | C1.2.2, C1.2.3 |
| F13 | Several Admin accounts with equal control | C1.1 #4 |
| F14 | "No score" when there are no attended days | C1.1 #11 |

### 7.3 Not in version 1

| Item | Why |
|---|---|
| Incentives (amounts, thresholds) | Owner decision (C1.1 #7) |
| OT | Next scope (B4) |
| Employee login | App is Admin-only |
| Owner role with different rights | Later |
| Half-day leave, leave reasons, leave limits | Out of scope (B5.17) |
| Working on a holiday or weekly off | Out of scope |
| A "system failure / excused" status | Open with the owner (C1.4 #6) |
| Cut-off for late notice | Deferred; a place is kept for it |
| Import from an attendance machine | Later; version 1 is manual |
| Weekly figures | Only the monthly score matters (A5 #2) |
| Languages other than English | Not needed |

### 7.4 Assumptions

| # | Assumption | If wrong |
|---|---|---|
| 1 | The Admin's phone has internet at the factory | An offline mode would be needed |
| 2 | One factory, one time zone | Time handling needs review |
| 3 | The number of employees stays small (tens, not hundreds) | Today screen needs search and grouping |
| 4 | The Admin records times on the day or soon after | More reliance on "Needs attention" |
| 5 | Admins are trusted; all can do everything | Roles would be needed |
| 6 | No past Excel data needs to be brought in | An import step would be needed |
| 7 | Most employees share one weekly off (Sunday), as the Excel sheet's one holiday per week suggests | Only the pre-selected button changes |

---

## 8. Release

**Order of work** (details in C3). Each step is usable before the next
starts.

| Step | What is delivered |
|---|---|
| 1 | Scoring rules as tested code (no screens) |
| 2 | Sign in, employees, calendar |
| 3 | Today screen: daily entry with live result line |
| 4 | Results and employee breakdown |
| 5 | Month close and reopen, needs-attention list |
| 6 | Point values, Admin accounts, history |
| 7 | Trial month run beside Excel, then go-live |

**Later versions (not planned in detail):** incentives, OT, late-notice
cut-off, system-failure handling, Owner role, import from an attendance
machine.

**Design:** the style reference and the owner's UX brief are in
`docs/guidelines/`. Usability comes first: the most frequent action, logging
one person's arrival time, must be the fastest thing in the app.
