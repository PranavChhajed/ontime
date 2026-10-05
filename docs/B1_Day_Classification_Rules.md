# Part B1 — Day Classification Rules
**Punctuality Scoring System — Documentation Set**
Version 1.3 (Final — Version 1 scope)

---

## Contents
- B1.0 About this document
- B1.1 Status labels used in this document
- B1.2 Key terms
- B1.3 The five day categories
- B1.4 Arrival time bands (exact boundaries)
- B1.5 Time precision rule (minute-based)
- B1.6 One arrival time per day
- B1.7 Day status category: Approved leave
- B1.8 Overtime days in version 1
- B1.9 Days that are not classified
- B1.10 Classification order (decision steps)
- B1.11 What each category leads to (downstream effects)
- B1.12 Data needed to classify a day
- B1.13 What is stored for each day (traceability)
- B1.14 Classification examples
- B1.15 Boundary test cases
- B1.16 Rules the app must enforce
- B1.17 Deferred system problems (known, to be worked on later)
- B1.18 Who does what
- B1.19 Out of scope for version 1
- B1.20 How this maps to the current Excel sheet
- B1.21 Decisions log (this document)
- B1.22 Open items

---

## B1.0 About this document

### Purpose
This document defines **how every day of every employee is put into exactly
one category**. Classification is the **first step** of scoring. Every later
step (points, notice points, base requirement, monthly score) depends on it.

### Scope
**Covered here**
- The five categories and what each means
- Exact time boundaries for the arrival bands, and how seconds are treated
- How days with overtime are treated in version 1
- Which days are classified and which are not
- The order in which a day's category is decided
- What is stored for each day so it can be traced
- App enforcement rules, and the known system problems deferred to later

**Covered in other documents**

| Topic | Document |
|---|---|
| Points for each category | B2 Points Table |
| Who can earn notice points, and how | B3 Notice (Inform) Rules |
| OT (next scope only) | B4 OT Rules |
| Leave, holidays, weekly offs | Neutral Days Rules |
| The monthly calculation | Monthly Score Calculation |

### Source of truth
Where this document and the current Excel sheet differ, **this document
wins**.

### Version scope
This document describes **version 1**. **OT is not part of version 1**
(see B1.8 and B4).

---

## B1.1 Status labels used in this document

| Label | Meaning |
|---|---|
| **Confirmed** | Decided by the owner |
| **Derived** | Follows directly from confirmed rules |
| **Deferred** | A known system problem the owner has acknowledged. It must be kept in mind in the design but will be worked on later |
| **Out of scope** | Not part of version 1 |
| **Open** | Not yet decided |

---

## B1.2 Key terms

| Term | Meaning |
|---|---|
| Reporting time | 9:30 AM |
| Working day | A day in the month that is not a holiday or weekly off |
| Non-working day | A holiday or weekly off |
| Day category | The one label a working day receives |
| Arrival time | The single time the employee arrived for work that day, read to the minute |
| Day status | Approved leave, set by the Admin |
| Arrival band | One of the four time-based categories (1–4) |
| Unclassified day | A working day with no arrival time and no leave status |
| Admin | The role that records all data and makes all decisions |
| Employee | The person being scored |

---

## B1.3 The five day categories

Every **working day** of an employee gets **exactly one** of these
categories.

| # | Category | Type | Decided by | Status |
|---|---|---|---|---|
| 1 | On time | Arrival band | Arrival time | Confirmed |
| 2 | 9:31–9:34 | Arrival band | Arrival time | Confirmed |
| 3 | 9:35–9:40 | Arrival band | Arrival time | Confirmed |
| 4 | After 9:40 | Arrival band | Arrival time | Confirmed |
| 5 | Approved leave | Day status | Admin marks it | Confirmed |

### Core rules
1. **One day, one category.** A working day can never be in two categories.
   *(Confirmed)*
2. **Every working day must be accounted for.** A working day without a
   category is incomplete data. *(Confirmed; how it is scored is Open, see
   B1.9.2)*
3. **Non-working days are not classified.** Holidays and weekly offs get no
   category and are not scored. *(Confirmed)*
4. **Each working day is classified on its own.** What happens on one day
   never changes another day's category. *(Confirmed)*

---

## B1.4 Arrival time bands (exact boundaries)

Categories 1–4 are decided **only by arrival time**, read **to the minute**
(see B1.5).

| # | Category | First minute | Last minute | Status |
|---|---|---|---|---|
| 1 | On time | Any minute before 9:30 | 9:30 | Confirmed |
| 2 | 9:31–9:34 | 9:31 | 9:34 | Confirmed |
| 3 | 9:35–9:40 | 9:35 | 9:40 | Confirmed |
| 4 | After 9:40 | 9:41 | Any later minute | Confirmed |

```
  any minute before 9:30 … 9:30 | 9:31 … 9:34 | 9:35 … 9:40 | 9:41 …
  |-------- 1. On time ---------|---- 2. -----|---- 3. -----|---- 4. ---->
```

### Notes
- **Arriving earlier gives no extra credit.** 6:30, 8:00 and 9:29 are all
  just "On time". The system measures punctuality, not work. *(Confirmed)*
- **There are no gaps or overlaps.** Every possible arrival minute falls in
  exactly one band. *(Derived)*

---

## B1.5 Time precision rule (minute-based)

**Rule:** the band is decided by the **minute** of the arrival time.
**Seconds are ignored.** *(Confirmed)*

| Arrival time | Minute used | Band |
|---|---|---|
| 9:30:00 | 9:30 | 1. On time |
| 9:30:59 | 9:30 | 1. On time |
| 9:31:00 | 9:31 | 2. 9:31–9:34 |
| 9:34:30 | 9:34 | 2. 9:31–9:34 |
| 9:34:59 | 9:34 | 2. 9:31–9:34 |
| 9:35:00 | 9:35 | 3. 9:35–9:40 |
| 9:40:30 | 9:40 | 3. 9:35–9:40 |
| 9:40:59 | 9:40 | 3. 9:35–9:40 |
| 9:41:00 | 9:41 | 4. After 9:40 |

**For the app** *(Derived)*: drop the seconds and compare the hour and minute
only. **Never round up.** For example, 9:30:59 stays 9:30; it never becomes
9:31.

---

## B1.6 One arrival time per day

- Each employee has **at most one arrival time per day**. *(Confirmed)*
- Classification therefore never has to choose between several times.
  *(Derived)*
- The app must store only **one** arrival time per employee per day.
  *(Derived)*

---

## B1.7 Day status category: Approved leave

Category 5 is **set by the Admin**. It is not worked out from arrival time.

| Point | Rule | Status |
|---|---|---|
| Meaning | The employee is on leave for the whole day | Confirmed |
| Approval | **All leave is approved**; there is no "unapproved leave" category | Confirmed |
| Who marks it | Admin | Confirmed |
| Effect | Neutral: the day is removed from the base requirement (see *Neutral Days Rules*) | Confirmed |
| Half-day leave | Not part of version 1 | Out of scope |

---

## B1.8 Overtime days in version 1

| Point | Rule | Status |
|---|---|---|
| OT category | **There is no OT category in version 1.** OT is kept strictly for the next scope (see B4) | Confirmed |
| Day with overtime | Classified **by its arrival time**, like any other working day | Confirmed |
| Example | Arriving at **6:30 AM** for overtime → arrival minute before 9:30 → **On time** | Confirmed |
| No OT marking | The Admin does not mark OT in version 1 | Derived |
| No special treatment | A day with overtime gets no extra or different points | Derived |

---

## B1.9 Days that are not classified

### B1.9.1 Holidays and weekly offs
- These are **non-working days**. *(Confirmed)*
- They get **no category** and are **not scored**. *(Confirmed)*
- The Admin sets them for the month. *(Confirmed)*
- **Working on a holiday or weekly off** can happen, but it is **not handled
  in version 1**. *(Out of scope)*

### B1.9.2 Working days with no data (unclassified)
- A working day with no arrival time and no leave status **cannot be
  classified**. *(Derived)*
- **Current Excel behaviour:** such a day scores 0 but stays in the base
  requirement, so it is treated like "After 9:40, not informed".
- **That is not the intended rule.** The owner's goal is that missing data
  must not be treated as bad behaviour.
- **How unclassified days and attendance-system failures are scored is
  Open.** How the app should flag and handle them is **Deferred** (see B1.17).

---

## B1.10 Classification order (decision steps)

For each employee, for each day of the month, apply these steps **in order**
and **stop** at the first one that applies. *(Derived from confirmed rules)*

```
Step 1  Is the day a holiday or weekly off?
          YES → Not classified (non-working day).                STOP
          NO  → Step 2

Step 2  Has the Admin marked the day as Approved leave?
          YES → Category 5: Approved leave.                       STOP
          NO  → Step 3

Step 3  Is there an arrival time?
          NO  → Unclassified (missing data — scoring Open).       STOP
          YES → Step 4

Step 4  Take the arrival time to the minute (ignore seconds):
          9:30 or earlier → Category 1: On time
          9:31 – 9:34     → Category 2: 9:31–9:34
          9:35 – 9:40     → Category 3: 9:35–9:40
          9:41 or later   → Category 4: After 9:40                STOP
```

**Notes**
- Leave status (Step 2) is checked **before** arrival time.
- A leave day that also has an arrival time is a known system problem and is
  **Deferred** (see B1.17).

---

## B1.11 What each category leads to (downstream effects)

Summary only. Details are in the other documents.

| Category | Points | Notice points allowed? | In base requirement? |
|---|---|---|---|
| 1. On time | 6 | No | Yes |
| 2. 9:31–9:34 | 4.5 | No | Yes |
| 3. 9:35–9:40 | 2 | **Yes** (1.5 by 9:30 / 1 late) | Yes |
| 4. After 9:40 | 0 | **Yes** (1.5 by 9:30 / 1 late) | Yes |
| 5. Approved leave | 0 | No | **No** (removed) |
| Non-working day | — | — | Not a working day |
| Unclassified | Open | Open | Open |

---

## B1.12 Data needed to classify a day

For each employee, for each day:

| Field | Needed for | Set by | Status |
|---|---|---|---|
| Date | All steps | — | Derived |
| Employee | All steps | — | Derived |
| Is the day a holiday / weekly off? | Step 1 | Admin (per month) | Confirmed |
| Approved leave? (yes/no) | Step 2 | Admin | Confirmed |
| Arrival time (one per day, to the minute) | Steps 3–4 | Admin now (manual); app later derives it where possible | Confirmed |

---

## B1.13 What is stored for each day (traceability)

Both rules below are **Confirmed** by the owner.

### B1.13.1 Each day shows how it was decided
Each day's record must show:
- **The category**, and
- **How it was decided**, either:
  - *"From arrival time"*, with the time shown (for example, "From arrival
    time 9:36 → 9:35–9:40"), or
  - *"Marked by Admin: Approved leave"*.

### B1.13.2 Changes stay visible
If the Admin changes a day's arrival time or leave status after it was first
recorded, the change must be kept and visible on that day's record:
- what the value was before,
- what it was changed to,
- and when it was changed.

The earlier value is **never silently overwritten**. This lets the Admin
explain any score later, even if a record was corrected.

| Example | What the day shows |
|---|---|
| Arrival entered as 9:42, later corrected to 9:32 | Arrival time 9:32 → 9:31–9:34; changed from 9:42 (date of change) |
| Day first marked Approved leave, later corrected to an arrival at 9:20 | Arrival time 9:20 → On time; changed from Approved leave (date of change) |

---

## B1.14 Classification examples

Each row is one working day for one employee (unless marked as a non-working
day).

| # | Situation | Category | Shown as decided by |
|---|---|---|---|
| 1 | Arrived 6:30 (for overtime) | On time | From arrival time 6:30 |
| 2 | Arrived 8:15 | On time | From arrival time 8:15 |
| 3 | Arrived 9:29 | On time | From arrival time 9:29 |
| 4 | Arrived 9:30:45 | On time | From arrival time 9:30 |
| 5 | Arrived 9:31 | 9:31–9:34 | From arrival time 9:31 |
| 6 | Arrived 9:34:30 | 9:31–9:34 | From arrival time 9:34 |
| 7 | Arrived 9:35 | 9:35–9:40 | From arrival time 9:35 |
| 8 | Arrived 9:40:30 | 9:35–9:40 | From arrival time 9:40 |
| 9 | Arrived 9:41 | After 9:40 | From arrival time 9:41 |
| 10 | Arrived 11:00 | After 9:40 | From arrival time 11:00 |
| 11 | Worked late the previous night; arrived 9:45 | After 9:40 | From arrival time 9:45 (previous day has no effect) |
| 12 | On approved leave | Approved leave | Marked by Admin: Approved leave |
| 13 | Weekly off | Not classified | Non-working day |
| 14 | Holiday | Not classified | Non-working day |
| 15 | Working day, nothing recorded | Unclassified | — (scoring Open; handling Deferred) |
| 16 | Employee worked on a holiday | Not handled | Out of scope in version 1 |
| 17 | Half-day leave | Not handled | Out of scope in version 1 |

---

## B1.15 Boundary test cases

For the developer to test classification at every edge. *(Derived)*

**Arrival time**

| Arrival time | Expected category |
|---|---|
| 6:30:00 | On time |
| 9:29:59 | On time |
| 9:30:00 | On time |
| 9:30:59 | On time |
| 9:31:00 | 9:31–9:34 |
| 9:34:00 | 9:31–9:34 |
| 9:34:59 | 9:31–9:34 |
| 9:35:00 | 9:35–9:40 |
| 9:40:00 | 9:35–9:40 |
| 9:40:59 | 9:35–9:40 |
| 9:41:00 | After 9:40 |

**Status and data**

| Situation | Expected result |
|---|---|
| Leave marked, no arrival | Approved leave |
| Holiday, no data | Not classified |
| No leave, no arrival, working day | Unclassified |
| Leave marked and arrival recorded | Deferred system problem (B1.17) |

---

## B1.16 Rules the app must enforce

| # | Rule | Status |
|---|---|---|
| 1 | Every working day gets exactly one of the five categories | Confirmed |
| 2 | Holidays and weekly offs get no category | Confirmed |
| 3 | Arrival bands (1–4) are worked out from the arrival time, to the minute, ignoring seconds and never rounding up | Confirmed |
| 4 | Only one arrival time per employee per day | Confirmed |
| 5 | Leave status is checked before arrival time | Derived |
| 6 | Only the Admin can mark leave, holidays and weekly offs | Confirmed |
| 7 | Each day is classified on its own; no day affects another | Confirmed |
| 8 | There is no OT category; days with overtime are classified by arrival time | Confirmed |
| 9 | Each day shows its category and how it was decided | Confirmed |
| 10 | Changes to a day's time or status stay visible (before, after, when) | Confirmed |

---

## B1.17 Deferred system problems (known, to be worked on later)

The owner has confirmed these are **real system problems** that must be
**kept in mind in the app design**, but the way to handle them will be
**decided later**. The app should be built so these can be added without
redesign.

| # | Problem | Why it matters |
|---|---|---|
| 1 | A **leave day that also has an arrival time** | The record contradicts itself |
| 2 | An **arrival time recorded on a holiday or weekly off** | Holiday work is out of scope; the day must not be scored by mistake |
| 3 | A **working day with nothing recorded** (unclassified) | Missing data must not be treated as bad behaviour |
| 4 | **Closing the month while problem days remain** (unclassified or contradictory) | Monthly scores must be complete and explainable |

Status of all four: **Deferred.**

*(The earlier problem "a day marked as both leave and OT" no longer applies,
because OT is not part of version 1.)*

---

## B1.18 Who does what

| Task | Employee | Admin |
|---|---|---|
| Arrive for work | ✔ | |
| Record arrival time (current phase: manual) | | ✔ |
| Mark approved leave | | ✔ |
| Set holidays and weekly offs for the month | | ✔ |
| Correct records (changes stay visible) | | ✔ |
| Decide cases not covered by the rules (using Part A, A2.7) | | ✔ |

---

## B1.19 Out of scope for version 1

| Item | Status |
|---|---|
| OT as a day category | Next scope (see B4) |
| Employee working on a holiday or weekly off | Out of scope (it can happen, but is not handled now) |
| Half-day leave | Out of scope |

---

## B1.20 How this maps to the current Excel sheet

**For reference only.** In the sheet "Punctuality-Arrival", the Admin
classifies days by hand and enters **weekly counts** per category.

| Category | Excel row | Excel label |
|---|---|---|
| On time | 13 | 9.30 |
| 9:31–9:34 | 14 | 9.34 |
| 9:35–9:40 | 15 | 9.4 |
| After 9:40 | 16 | After 9.40 |
| Approved leave | 17 | Leave Taken |
| *(not used in version 1)* | 18 and 19 | Night OT (NOT), Morning OT (MOT) |

- **Working days per week:** row 7 = days in week (B4:E4) − holidays (B5:E5).
- **Completeness check:** row 23 adds up rows 13–19 for each week and turns
  **red** if the total doesn't equal the working days in row 7.

**Where Excel differs from these rules**

| # | Excel behaviour | This document |
|---|---|---|
| 1 | Stores weekly counts, not daily records | One record per day |
| 2 | Admin types categories by hand | Arrival bands worked out from the arrival time |
| 3 | Has Night OT and Morning OT rows | No OT category; those days are classified by arrival time |
| 4 | Missing days only show as a red mismatch; the score is still calculated | Unclassified; scoring Open, handling Deferred |
| 5 | Holidays are one count per week, applied to all employees | Admin sets holidays and weekly offs |
| 6 | No record of how a count was decided or changed | Each day shows how it was decided; changes stay visible |

---

## B1.21 Decisions log (this document)

| # | Decision | Status |
|---|---|---|
| 1 | Five categories: On time, 9:31–9:34, 9:35–9:40, After 9:40, Approved leave | Confirmed |
| 2 | On time includes the whole 9:30 minute | Confirmed |
| 3 | Bands are decided by the minute; seconds are ignored (9:34:30 → 9:31–9:34; 9:40:30 → 9:35–9:40) | Confirmed |
| 4 | Only one arrival time per employee per day | Confirmed |
| 5 | All leave is approved | Confirmed |
| 6 | Each day shows how it was decided | Confirmed |
| 7 | Changes to a day stay visible | Confirmed |
| 8 | **OT removed from version 1**; kept strictly for the next scope | Confirmed |
| 9 | Days with overtime are classified by arrival time (6:30 → On time) | Confirmed |
| 10 | The four system problems in B1.17 are acknowledged and deferred | Deferred |
| 11 | Working on holidays is out of scope for version 1 | Out of scope |
| 12 | Half-day leave is out of scope for version 1 | Out of scope |

---

## B1.22 Open items

| # | Item | Status |
|---|---|---|
| 1 | How unclassified (missing/blank) working days are scored | Open |
| 2 | How attendance-system failures are handled | Open (owner will decide later) |
| 3 | How each deferred system problem in B1.17 is handled | Deferred |