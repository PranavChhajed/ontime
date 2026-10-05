# Part B3 — Notice (Inform) Rules
**Punctuality Scoring System — Documentation Set**
Version 1.2 (Final — Version 1 scope)

---

## Contents
- B3.0 About this document
- B3.1 Status labels used in this document
- B3.2 Key terms
- B3.3 What notice is, and why it exists
- B3.4 Who can earn notice points (eligibility)
- B3.5 Notice outcomes and points
- B3.6 Timing rules
- B3.7 Core notice rules
- B3.8 What is recorded, and how the outcome is worked out
- B3.9 Deciding a day's notice outcome (decision steps)
- B3.10 Points per day with and without notice
- B3.11 Examples
- B3.12 Test cases
- B3.13 Why notice cannot be used to game the score
- B3.14 Rules the app must enforce
- B3.15 Who does what
- B3.16 Out of scope and deferred
- B3.17 How this maps to the current Excel sheet
- B3.18 Decisions log (this document)
- B3.19 Open items

---

## B3.0 About this document

### Purpose
This document defines **notice** (also called "inform"): when an employee
who arrives late can earn extra points for informing the Admin, how many
points, how the notice outcome is worked out, and the limits that stop
notice being used to hide lateness.

### Scope
**Covered here**
- Which days can earn notice points
- The notice outcomes and their points
- Timing rules (by 9:30, late, before arriving, same day only)
- What is recorded and how the outcome is worked out
- Anti-gaming protections and app enforcement rules

**Covered in other documents**

| Topic | Document |
|---|---|
| How a day's arrival band is decided | B1 Day Classification Rules |
| All point values, and who can change them | B2 Points Table |
| OT (not in version 1; next scope only) | B4 OT Rules |
| Monthly calculation | Monthly Score Calculation |

### Source of truth
Where this document and the current Excel sheet differ, **this document
wins**.

---

## B3.1 Status labels used in this document

| Label | Meaning |
|---|---|
| **Confirmed** | Decided by the owner |
| **Derived** | Follows directly from confirmed rules |
| **Deferred** | To be introduced or worked on later |
| **Out of scope** | Not part of this phase |
| **Open** | Not yet decided |

---

## B3.2 Key terms

| Term | Meaning |
|---|---|
| Notice / inform | The employee telling the Admin, on the same day and before arriving, that they will be late |
| Notice time | The time the employee informed the Admin, read to the minute |
| Arrival time | The time the employee arrived, read to the minute (B1) |
| Eligible day | A working day in the 9:35–9:40 or After-9:40 band |
| Notice outcome | One of: informed by 9:30, informed late, not informed |
| Notice points | Extra points earned for notice on an eligible day |
| Category points | Points from the day's arrival band (B2) |
| Day points | Category points + notice points |

---

## B3.3 What notice is, and why it exists

- Notice is the employee **telling the Admin** that they will be late.
  *(Confirmed)*
- On an eligible day, notice **earns extra points** on top of the arrival
  points. *(Confirmed)*
- **Purpose**, from the owner's goals *(Confirmed)*:
  - **Informing should help**: an employee who informs scores higher than
    one who doesn't.
  - **Informing should never make lateness disappear**: a late day stays a
    late day, earning fewer points than an on-time day.

---

## B3.4 Who can earn notice points (eligibility)

| Day category | Can earn notice points? | Reason | Status |
|---|---|---|---|
| On time (up to 9:30) | **No** | Already on time; no need to inform | Confirmed |
| 9:31–9:34 | **No** | Not an eligible band | Confirmed |
| 9:35–9:40 | **Yes** | Eligible band | Confirmed |
| After 9:40 | **Yes** | Eligible band | Confirmed |
| Approved leave | **No** | Not an arrival day | Derived |
| Holiday / weekly off | **No** | Not a working day | Derived |
| Unclassified (missing data) | **No** | No arrival band | Derived |

**Eligibility depends only on the day's arrival band** (B1). Informing never
changes the band. *(Confirmed)*

---

## B3.5 Notice outcomes and points

Current values (the Admin can change them; see B2.16).

| Notice outcome | When | Points earned (eligible days only) | Status |
|---|---|---|---|
| Informed by 9:30 | Notice minute is 9:30 or earlier | **1.5** extra | Confirmed |
| Informed late | Notice minute is after 9:30 **and** before the arrival minute | **1** extra | Confirmed |
| Not informed | No notice, or notice at or after the arrival minute | **0** extra | Confirmed |

**Derived**
- Informing by 9:30 earns **0.5 more** than informing late.
- Informing late still earns **1 more** than not informing.

---

## B3.6 Timing rules

| # | Rule | Example | Status |
|---|---|---|---|
| 1 | Notice is judged **by the minute**; seconds are ignored (same as arrival, B1) | 9:30:40 → minute 9:30 | Confirmed |
| 2 | "By 9:30" means the notice minute is **9:30 or earlier** | Informed 9:30:40 → by 9:30 | Confirmed |
| 3 | Notice counts **only if given before arriving** | Informed 9:50 after arriving 9:45 → not counted | Confirmed |
| 4 | Notice in the **same minute** as arrival is **not counted** | Informed 9:45, arrived 9:45 → not counted | Confirmed |
| 5 | Notice must be given **on the same day**; notice the day before is not allowed | "I'll be late tomorrow" → not counted | Confirmed |
| 6 | For now, **any** notice after 9:30 and before arriving counts as "informed late" | Informed 10:05, arrived 10:20 → late | Confirmed |
| 7 | A **cut-off** for late notice will be introduced later | — | Deferred |

**Derived:** every eligible day has an arrival of 9:35 or later, so notice
"by 9:30" is always before arriving.

```
          notice minute
   ≤ 9:30 ───────────────→ Informed by 9:30   (1.5)
   9:31 … (arrival − 1) ──→ Informed late      (1)
   = arrival or later ────→ Not informed       (0)
   none ──────────────────→ Not informed       (0)
```

---

## B3.7 Core notice rules

| # | Rule | Status |
|---|---|---|
| 1 | Notice points are **only** earned on 9:35–9:40 and After-9:40 days | Confirmed |
| 2 | Notice points are **added on top** of category points | Confirmed |
| 3 | Notice **never replaces** category points and never changes the arrival band | Confirmed |
| 4 | Points are only earned, **never deducted**; not informing earns 0 extra, it takes nothing away | Confirmed |
| 5 | Each eligible day has **exactly one** notice outcome | Derived |
| 6 | Each day has **at most one** notice time | Derived (one notice outcome per day) |
| 7 | Notice on one day never affects another day | Derived (each day stands alone, B1) |
| 8 | The employee informs the **Admin** | Confirmed (two roles) |
| 9 | There is **no monthly limit** on how many eligible days can earn notice points | Confirmed |

---

## B3.8 What is recorded, and how the outcome is worked out

### Decision
The Admin records the **notice time** (to the minute). The app **works out
the notice outcome** from the notice time and the arrival time. The outcome
is not typed in by hand. *(Confirmed: owner left this decision to the
documentation)*

**Why**
- **Explainable:** each day can be explained from its records, for example
  "Informed 9:22, arrived 9:47 → 9:35–9:40 + informed by 9:30 = 3.5 points".
- **Ready for the deferred cut-off:** when the late-notice cut-off is added,
  the outcome can be worked out from the same recorded time. Nothing new
  needs to be entered.
- **Consistent:** a hand-typed outcome cannot contradict the recorded times.

### Recorded per day

| Field | Who records | Status |
|---|---|---|
| Notice time (to the minute), or blank if no notice | Admin | Confirmed |
| Arrival time (from B1) | Admin (now manual) | Confirmed |

### Worked out by the app

| Result | How | Status |
|---|---|---|
| Notice outcome | From notice time vs 9:30 and vs arrival time (B3.6) | Derived |
| Notice points | From the outcome, **only** on eligible days | Derived |
| Explanation shown on the day | e.g. "Informed 9:22 (by 9:30) → 1.5 extra" | Confirmed (each day shows how it was decided) |

### Notice on non-eligible days
- If a notice time is recorded on a day that ends up **not eligible** (on
  time, 9:31–9:34, leave), the app **keeps the notice time on the
  record** but gives **no** notice points. *(Confirmed)*
- Example: "Informed 9:15, arrived 9:33 → 9:31–9:34; notice not eligible →
  0 extra".

### Changes
- Any change to a notice time stays visible (old value, new value, when).
  *(Confirmed: changes stay visible)*

---

## B3.9 Deciding a day's notice outcome (decision steps)

Apply after the day's category has been decided (B1). *(Derived)*

```
Step 1  Is the day 9:35–9:40 or After 9:40?
          NO  → Notice points = 0 (keep any notice time on record).   STOP
          YES → Step 2

Step 2  Is a notice time recorded (same day)?
          NO  → Not informed: 0 extra.                                STOP
          YES → Step 3

Step 3  Take the notice time to the minute (ignore seconds).
        Is the notice minute the same as or later than the arrival minute?
          YES → Not informed (not before arriving): 0 extra.          STOP
          NO  → Step 4

Step 4  Is the notice minute 9:30 or earlier?
          YES → Informed by 9:30: 1.5 extra.                          STOP
          NO  → Informed late:    1 extra.                            STOP
                (A cut-off for late notice is Deferred.)
```

---

## B3.10 Points per day with and without notice

Current values. *(Derived)*

| Day category | Not informed | Informed late | Informed by 9:30 | Best possible compared with on time (6) |
|---|---|---|---|---|
| 9:35–9:40 | 2 | 3 | 3.5 | 2.5 fewer |
| After 9:40 | 0 | 1 | 1.5 | 4.5 fewer |
| On time | 6 | not eligible | not eligible | — |
| 9:31–9:34 | 4.5 | not eligible | not eligible | — |

**What this shows** *(Derived)*
- With notice, an eligible day still earns **short of the base (5)**.
- Even the best notice leaves a late day below a 9:31–9:34 day (4.5).
- **Notice helps, but lateness never disappears.**

---

## B3.11 Examples

One working day each. Current values.

| # | Notice time | Arrival | Category | Notice outcome | Day points |
|---|---|---|---|---|---|
| 1 | — | 9:20 | On time | Not eligible | 6 |
| 2 | 9:10 | 9:20 | On time | Not eligible (time kept on record) | 6 |
| 3 | 9:15 | 9:33 | 9:31–9:34 | Not eligible (time kept on record) | 4.5 |
| 4 | — | 9:37 | 9:35–9:40 | Not informed | 2 |
| 5 | 9:30:40 | 9:37 | 9:35–9:40 | By 9:30 (minute 9:30) | 3.5 |
| 6 | 9:33 | 9:37 | 9:35–9:40 | Late | 3 |
| 7 | 9:37 | 9:37 | 9:35–9:40 | Not informed (same minute as arrival) | 2 |
| 8 | 9:39 | 9:37 | 9:35–9:40 | Not informed (after arriving) | 2 |
| 9 | 9:05 | 10:15 | After 9:40 | By 9:30 | 1.5 |
| 10 | 10:00 | 10:15 | After 9:40 | Late | 1 |
| 11 | — | 10:15 | After 9:40 | Not informed | 0 |
| 12 | Previous day: "late tomorrow" | 9:50 | After 9:40 | Not informed (day-before notice not allowed) | 0 |
| 14 | — | Approved leave | Approved leave | Not eligible | Not in base |

Example 13 (OT day) was removed because OT is not part of version 1.

**Month illustration** (26 working days, base 130, other days on time):

| Month | Total points | Score |
|---|---|---|
| 25 on time + 1 After 9:40, not informed | 150 | 115.4% |
| 25 on time + 1 After 9:40, informed late | 151 | 116.2% |
| 25 on time + 1 After 9:40, informed by 9:30 | 151.5 | 116.5% |
| 22 on time + 4 After 9:40, all informed by 9:30 | 138 | 106.2% |
| 22 on time + 4 After 9:40, none informed | 132 | 101.5% |

---

## B3.12 Test cases

For the developer. *(Derived)*

| Category | Notice time | Arrival | Expected notice points |
|---|---|---|---|
| On time | 9:10 | 9:25 | 0 (not eligible; time kept) |
| 9:31–9:34 | 9:20 | 9:32 | 0 (not eligible; time kept) |
| 9:35–9:40 | — | 9:36 | 0 |
| 9:35–9:40 | 9:30:00 | 9:36 | 1.5 |
| 9:35–9:40 | 9:30:59 | 9:36 | 1.5 |
| 9:35–9:40 | 9:31:00 | 9:36 | 1 |
| 9:35–9:40 | 9:35 | 9:36 | 1 |
| 9:35–9:40 | 9:36 | 9:36 | 0 (same minute) |
| 9:35–9:40 | 9:38 | 9:36 | 0 (after arriving) |
| After 9:40 | 8:45 | 11:00 | 1.5 |
| After 9:40 | 10:59 | 11:00 | 1 |
| After 9:40 | 11:00 | 11:00 | 0 (same minute) |
| After 9:40 | Previous day | 9:50 | 0 (day-before not allowed) |
| Approved leave | 9:00 | — | 0 (not eligible) |

---

## B3.13 Why notice cannot be used to game the score

| Possible gaming | Why it doesn't work | Status |
|---|---|---|
| Inform every day "just in case" | Only 9:35-and-later days earn notice points; other days earn nothing extra | Confirmed |
| Arrive very late but inform, to avoid losing points | The best notice leaves an After-9:40 day at 1.5, far short of on time (6) and the base (5) | Derived |
| Inform to turn a late day into an on-time day | Notice never changes the band | Confirmed |
| Inform after arriving | Only notice before arriving counts | Confirmed |
| Inform the day before | Not allowed | Confirmed |
| Record notice twice for one day | One notice time per day | Derived |
| Admin types an outcome that doesn't match the times | The outcome is worked out from the recorded times, not typed in | Derived (B3.8) |

**No monthly limit:** an employee who is late and informs by 9:30 every
day earns at most 3.5 or 1.5 per day, which is always short of the base, so
the score stays low. *(Confirmed: no limit for now; Derived: effect)*

---

## B3.14 Rules the app must enforce

| # | Rule | Status |
|---|---|---|
| 1 | Notice points only on 9:35–9:40 and After-9:40 days | Confirmed |
| 2 | No notice points on on-time, 9:31–9:34, leave, holiday or unclassified days | Confirmed / Derived |
| 3 | Notice is judged by the minute; seconds ignored; never rounded up | Confirmed |
| 4 | "By 9:30" = notice minute 9:30 or earlier | Confirmed |
| 5 | Notice counts only if its minute is **before** the arrival minute | Confirmed |
| 6 | Notice must be on the same day | Confirmed |
| 7 | At most one notice time per day | Derived |
| 8 | Notice outcome is **worked out** from notice time and arrival time, not typed in | Confirmed (B3.8) |
| 9 | Notice times on non-eligible days are kept on record but earn 0 | Confirmed |
| 10 | Notice points are added to category points; never replace them | Confirmed |
| 11 | Notice never changes the arrival band | Confirmed |
| 12 | Only the Admin records or changes notice | Confirmed |
| 13 | Each day shows its notice time, outcome and points earned | Confirmed |
| 14 | Changes to notice records stay visible | Confirmed |
| 15 | Notice point values come from the Points Table (Admin can change them) | Confirmed (B2.16) |
| 16 | The app is built so a late-notice cut-off can be added later | Deferred |

---

## B3.15 Who does what

| Task | Employee | Admin |
|---|---|---|
| Inform the Admin, on the same day, before arriving | ✔ | |
| Receive the notice | | ✔ |
| Record the notice time (to the minute) | | ✔ |
| Correct a notice time (change stays visible) | | ✔ |
| Change notice point values | | ✔ |

---

## B3.16 Out of scope and deferred

| Item | Status |
|---|---|
| How the employee informs (phone, in person, message) | Out of scope |
| Proof of notice | Out of scope |
| Employee informs they will be late but does not come at all | Out of scope |
| Cut-off time for "informed late" | Deferred (to be introduced later) |

---

## B3.17 How this maps to the current Excel sheet

**For reference only.** Sheet "Punctuality-Arrival".

| Item | Excel |
|---|---|
| Notice by 9:30 points | A20 = 1.5 (label "Inform BY 9.30") |
| Notice late points | A21 = 1 (label "late inform") |
| Counts per week | Row 20 (by 9:30) and row 21 (late), e.g. I20, I21 |
| Points | J20 = `$A20*I20`, J21 = `$A21*I21` |
| Included in total | J23 = `SUM(J13:J22)` |
| Check | Pink highlight on week W-1's "by 9:30" points cell in each employee block when it ≠ `($I$15+$I$16)*$A$20` |

**Where Excel differs from these rules**

| # | Excel behaviour | This document |
|---|---|---|
| 1 | Notice is a weekly count, with no notice time and no link to specific days | Notice time recorded per day; outcome worked out |
| 2 | The Admin decides "by 9:30" or "late" by hand | Outcome worked out from notice and arrival times |
| 3 | Nothing stops notice counts exceeding eligible days (3 notices against 2 eligible days was accepted) | At most one per day; only eligible days earn points |
| 4 | The pink check covers week W-1 only, always uses the **first employee's** cells (I15, I16), and ignores late notice | Every eligible day checked for every employee |
| 5 | The pink check flags any week where not every eligible day was informed by 9:30, which is a valid situation | Not informing is allowed; it just earns 0 extra |
| 6 | No way to tell if notice was before arriving or on the same day | Before arriving, same day only |

---

## B3.18 Decisions log (this document)

| # | Decision | Status |
|---|---|---|
| 1 | Notice points only for 9:35–9:40 and After-9:40 days | Confirmed |
| 2 | No notice points for on time or 9:31–9:34 days | Confirmed |
| 3 | Informed by 9:30 = 1.5 extra; informed late = 1 extra | Confirmed |
| 4 | Notice is added on top; it never makes lateness disappear | Confirmed |
| 5 | Notice is judged by the minute (9:30:40 = by 9:30) | Confirmed |
| 6 | Only notice before arriving counts; same minute as arrival is not counted | Confirmed |
| 7 | For now, any notice after 9:30 and before arriving counts as late | Confirmed |
| 8 | A cut-off for late notice will be introduced later | Deferred |
| 9 | Notice the day before is not allowed | Confirmed |
| 10 | No monthly limit on notice | Confirmed |
| 11 | Notice time is recorded; the outcome is worked out by the app | Confirmed (left to documentation) |
| 12 | Notice times on non-eligible days are kept on record, earning 0 | Confirmed |
| 13 | How employees inform, proof of notice, and inform-but-no-show are out of scope | Confirmed |
| 14 | OT is removed from version 1 (kept for the next scope, B4); a day with overtime is classified by arrival time and follows the normal notice rules | Confirmed |

---

## B3.19 Open items

| # | Item | Status |
|---|---|---|
| 1 | Cut-off time for "informed late" | Deferred (owner will introduce later) |
| 2 | Inform-but-no-show days | Out of scope this phase |