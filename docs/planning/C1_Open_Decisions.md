# Part C1 — Open Decisions and Off Things
**Punctuality Scoring System — Documentation Set**
Version 1.0 (planning stage, before any build) · 5 Oct 2026

---

## C1.0 About this document

This document records, in one place:

1. What was **decided** in the planning conversation (so it is not lost).
2. What the developer **decided on the owner's behalf**, with the reason.
3. **Working defaults** the build will use unless the owner says otherwise.
4. **Off things** found in the source documents and the Excel sheet.
5. Items that are **still open** and what the app does about them meanwhile.

Where this document and Parts A / B1 / B2 / B3 / B5 differ, the rules
documents still win on **rules**. This document only fills the gaps they
leave Open.

| Label | Meaning |
|---|---|
| **Confirmed** | Said by the owner |
| **Decided (dev)** | Owner delegated the choice; decision and reason given here. Can be reversed |
| **Default** | Not yet answered; the build assumes this unless told otherwise |
| **Open** | Not decided; does not block version 1 |

---

## C1.1 Confirmed in planning

| # | Decision | Status |
|---|---|---|
| 1 | The rules documents are followed as written; Excel is reference only | Confirmed |
| 2 | Base requirement is **5** (the Excel cell A12 still shows 3 and is ignored) | Confirmed |
| 3 | The app is **Admin-only**. Employees do not log in | Confirmed |
| 4 | There can be **several Admin accounts**. All have the same full control. A separate "Owner" role may come later; not in version 1 | Confirmed |
| 5 | The Admin can **add, edit and remove employees** | Confirmed |
| 6 | A closed month **can be reopened** and corrected by the Admin | Confirmed |
| 7 | **Incentives are left out** of version 1. The only final output is the monthly **percentage** | Confirmed |
| 8 | Scores are shown to **one decimal** (for example 118.8%) | Confirmed |
| 9 | **Holidays are company-wide**; leave is personal | Confirmed |
| 10 | A holiday that falls on a weekly off needs no special handling; the Admin enters and edits the calendar | Confirmed |
| 11 | A month where every working day is leave shows **"No score"**, not an error | Confirmed |
| 12 | **Phone first**, must also work on a PC. **English only** | Confirmed |
| 13 | Web app for now | Confirmed |

---

## C1.2 Decided by the developer (owner said "decide")

### C1.2.1 Monthly formula: one pooled ratio

**Decision:** Monthly score = total points for the month ÷ base requirement
for the month. It is **not** the average of four weekly ratios.
*(Decided (dev))*

**Reason.** The weekly average lets leave magnify a single late day, which
breaks the two highest-priority principles (Neutral, Fair).

Example: 26 working days. In one week the employee takes 5 days of leave and
on the one day they attend they arrive after 9:40 without informing. Every
other day of the month is on time.

| Method | Working | Score |
|---|---|---|
| Average of weekly ratios | (120% + 0% + 120% + 120%) ÷ 4 | **90.0%** |
| One pooled ratio | 120 points ÷ (21 attended × 5 = 105) | **114.3%** |

One late day costs 30 points under the weekly average, only because the
employee was on leave around it. Under the pooled ratio it costs what a
late day normally costs.

Other reasons:
- Every illustration in B2.14, B3.11 and B5.11 already uses the pooled ratio.
- A week of full leave cannot cause an error; only a full **month** of leave
  gives "No score" (C1.1 #11).
- Weeks of 7 and 9 days no longer count the same.
- No need to define where a "week" starts and ends.

**Effect to know about:** app scores will differ slightly from the Excel
sheet for the same data.

**Reversible:** the calculation is built with the method as a single switch,
so changing to the weekly average later needs no redesign.

### C1.2.2 Employees joining or leaving mid-month

**Decision.** *(Decided (dev))*
- Each employee has a **start date** and an optional **last working date**.
- Days before the start date or after the last working date are
  **not working days for that employee**: not classified, no points, not in
  the base. They behave exactly like a weekly off.
- The monthly score is worked out only over the days the employee was
  employed.
- An employee appears in a month's results if they were employed on at least
  one working day of that month.
- The result always shows **attended days next to the percentage**, so a
  score built on very few days is visible as such (for example
  "120.0% · 3 attended days").

**Reason.** Neutral is priority 1: nobody is penalised for days they were not
employed. It also needs no new rule, because the day is simply removed the
same way a weekly off is.

### C1.2.3 What "remove an employee" means

**Decision.** *(Decided (dev))*
- Removing an employee **sets their last working date** and hides them from
  daily entry after it. Their past records and scores stay.
- A true delete is allowed **only** if the employee has no day records at
  all (for example, added by mistake).

**Reason.** Explainable is the gate: a past month's result must remain
traceable to daily records after the person has left.

---

## C1.3 Working defaults — accepted by the owner

The owner reviewed these and said to go ahead with all of them. #1 was left
to the developer and is **Decided (dev)**; the rest are **Confirmed**.

| # | Question | Default the build will use | Why |
|---|---|---|---|
| 1 | Is a weekly off a fixed weekday, or can it move? | Each employee has a **usual weekly-off weekday**; the Admin can **override any single date** (make it a working day or an off) | Covers both cases with the least entry |
| 2 | When does a change to point values take effect? | From the **current open month onward**. Closed months are never recalculated | A past result must not change silently |
| 3 | A reopened month: which point values apply? | The values **saved when it was first closed** | Same reason as #2 |
| 4 | Working day with nothing recorded | Shown as **"Needs attention"**. Left out of points **and** base in the provisional score. The month **cannot be closed** while any remain. The Admin resolves each by entering an arrival time or marking leave | Missing data must not count as lateness (A2.2); a closed month must be complete (B1.17 #4) |
| 5 | A neutral "Excused / system failure" status | **Not built.** Five categories only, as the rules say | Rules say exactly five; see off thing C1.4 #6 |
| 6 | Who creates Admin accounts? | The first Admin is set up at installation; any Admin can add or remove another Admin | Simplest for one small team |
| 7 | Do changes record **which** Admin made them? | **Yes**: old value, new value, when, and who | Needed once there are several Admins |
| 8 | First month in the app | The month in which it goes live; no Excel data is imported | The Excel sheet holds only placeholder data |
| 9 | Time entry | Hours and minutes only (no seconds) | Rules judge by the minute |
| 10 | Rounding | Normal rounding to one decimal (118.846 → 118.8; 116.154 → 116.2) | Matches the documents' illustrations |

---

## C1.4 Off things found

| # | Where | What is off | What the build does |
|---|---|---|---|
| 1 | SYSTEM.md A2.1 and B3 §B3.8 | Example reads "Arrived 9:47, informed 9:22 → 9:35–9:40 + informed by 9:30 = 3.5 points". 9:47 is **After 9:40**, so it is **1.5 points** | Follows the rules (1.5). **Documents should be corrected** |
| 2 | SYSTEM.md A0.2 | Refers to "Monthly Score Calculation", "Incentive Mapping", "B4 OT Rules" and "Worked Examples / Edge Cases". None are in the folder | Monthly formula is now settled in C1.2.1; the others are out of version 1. If "Monthly Score Calculation" exists, please share it |
| 3 | Excel A12 | Base value is 3; documents say 5 | Uses 5 |
| 4 | Excel B4:E4 | Weeks add up to 30 days, but the month in B2 (October 2026) has 31 | Not relevant; the app works from the real calendar |
| 5 | B5.5 | Absent without informing = approved leave = neutral. Arriving at 9:45 = 0 points and stays in the base. So **not coming at all is better for the score than coming very late** | Built as written (Confirmed rule). Flagged in case it is not intended |
| 6 | A2.2 vs B1.3 | System failures "must not hurt anyone", but there are exactly five categories and the only neutral one is leave. In practice the Admin will mark failure days as leave, which makes leave counts inaccurate | Built with five categories (C1.3 #5). Stays Open with the owner |
| 7 | SYSTEM.md A1.3 | Says "two roles". The app has one kind of user | No conflict: the Employee is scored but never uses the app |
| 8 | Excel pink check | Flags any week where not every late day was informed by 9:30, which is a valid situation | Not copied |

---

## C1.5 Status of every Open item in the source documents

| Source | Item | Status now |
|---|---|---|
| A6 #1, B5.20 #5 | Attendance-system failures | **Open.** Meanwhile: C1.3 #4 |
| A6 #2, B1.22 #1 | Missing or blank days | **Open.** Meanwhile: C1.3 #4 |
| A6 #3, B5.13 #2 | A full week of leave | **Closed** by the pooled ratio (C1.2.1) |
| A6 #4 | Incentive thresholds and amounts | **Out of version 1** (C1.1 #7) |
| A6 #5, B2.19 #4 | Pooled ratio or weekly average | **Decided (dev):** pooled (C1.2.1) |
| A6 #6 | Minimal inputs to derive records | **Open.** Version 1 is manual entry |
| A6 #7, B3.19 #1 | Cut-off for "informed late" | **Deferred.** A place is kept for it |
| A6 #8, B2.19 #1 | When point-value changes take effect | **Default** (C1.3 #2, #3) |
| B1.17 #1 | Leave day with an arrival time | **Cannot happen** in manual entry: a day is either "arrived" or "leave" |
| B1.17 #2 | Arrival on a holiday / weekly off | **Cannot happen** in manual entry: entry is disabled on those days |
| B1.17 #3 | Working day with nothing recorded | **Default** (C1.3 #4) |
| B1.17 #4 | Closing a month with problem days | **Default:** blocked (C1.3 #4) |
| B5.20 #1 | Holidays per employee | **Confirmed:** company-wide |
| B5.20 #2 | Month with leave on every working day | **Confirmed:** "No score" |
| B5.20 #3 | Holiday on a weekly off | **Confirmed:** no special handling |
| B5.20 #4 | Joining / leaving mid-month | **Decided (dev)** (C1.2.2) |

---

## C1.6 Answers received

| # | Question | Answer |
|---|---|---|
| 1 | Defaults in C1.3 | Accepted; weekly offs (#1) left to the developer |
| 2 | Pooled monthly formula (C1.2.1) | Accepted |
| 3 | Absence scores better than very late arrival (C1.4 #5) | **Intended** |

Nothing in this document now blocks the build. The items marked **Open** in
C1.5 stay with the owner for a later version.

## C1.7 Next documents

| Document | Covers |
|---|---|
| C2 PRD | What the app does, screen by screen |
| C3 Implementation Plan | Stack, data model, scoring engine, tests, build order |
