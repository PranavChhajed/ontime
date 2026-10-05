# Part B2 — Points Table
**Punctuality Scoring System — Documentation Set**
Version 1.4 (Final — Version 1 scope)

---

## Contents
- B2.0 About this document
- B2.1 Status labels used in this document
- B2.2 Key terms
- B2.3 Core rule: points are only earned, never deducted
- B2.4 The base requirement
- B2.5 Category points
- B2.6 Notice points
- B2.7 Complete points per day (all valid combinations)
- B2.8 Each day compared with the base requirement
- B2.9 On-time days needed to make up a short day
- B2.10 Points not earned compared with being on time
- B2.11 Step sizes between bands
- B2.12 Value of notice
- B2.13 Limits: highest and lowest points
- B2.14 How points add up over a month (illustrations)
- B2.15 Rules the app must enforce
- B2.16 Changing point values (Admin)
- B2.17 How this maps to the current Excel sheet
- B2.18 Decisions log (this document)
- B2.19 Open items

---

## B2.0 About this document

### Purpose
This document defines **every point value in the system**: the base
requirement, the points for each day category, and the notice points.
It also shows what these values do, worked out from the numbers, and who
can change them.

### Scope
**Covered here**
- The base requirement per attended day
- The points for each of the five day categories
- The notice points and which categories can earn them
- Every valid points combination for a single day
- What each value does compared with the base, with on time, and over a month
- Who can change point values

**Covered in other documents**

| Topic | Document |
|---|---|
| Which category a day falls into | B1 Day Classification Rules |
| When notice counts as "by 9:30" or "late", and how it is recorded | Notice (Inform) Rules |
| OT (not in version 1; next scope only) | B4 OT Rules |
| How leave, holidays and offs affect the base | Neutral Days Rules |
| The monthly formula, step by step | Monthly Score Calculation |

### Source of truth
Where this document and the current Excel sheet differ, **this document
wins**.

---

## B2.1 Status labels used in this document

| Label | Meaning |
|---|---|
| **Confirmed** | Decided by the owner |
| **Derived** | Worked out directly from confirmed values (arithmetic only) |
| **Deferred** | Known problem; to be worked on later |
| **Out of scope** | Not part of this phase |
| **Open** | Not yet decided |

---

## B2.2 Key terms

| Term | Meaning |
|---|---|
| Category points | Points a working day earns from its category |
| Notice points | Extra points earned for informing the Admin, only on eligible days |
| Day points | Category points + notice points for one day |
| Base requirement | 5 points per attended day (current value) |
| Attended day | A working day that is not approved leave |
| Above base | A day that earns more than the base |
| Short of base | A day that earns less than the base |
| Total points | Sum of all day points for the month |
| Monthly score | Total points ÷ base requirement |
| Point values | The base requirement, category points and notice points together |

---

## B2.3 Core rule: points are only earned, never deducted

> **Points are only ever earned and added up. No points are ever deducted.**
> *(Confirmed)*

- Every day **earns** between **0 and 6** points from its category, plus
  notice points on eligible days (current values).
- All day points for the month are **added together**.
- The monthly score is total points **divided by** the base requirement.
- There are **no penalties, fines or negative points** anywhere in the
  system.
- A late day simply **earns fewer points**. For example, an After-9:40 day
  earns 0; nothing is taken away.

Where this document compares a day with the base (for example, "5 points
short of base"), that is **only an explanation** of the day's effect on the
score. It is **not** a deduction.

The only subtractions in the system are on **days, not points**:
- Working days = calendar days − holidays − weekly offs
- Attended days = working days − approved leave days

---

## B2.4 The base requirement

| Item | Value | Status |
|---|---|---|
| Base requirement per attended day | **5 points** (current value) | Confirmed |
| What it is | A **base requirement**, not a pass mark | Confirmed |
| Monthly base requirement | Attended days × base requirement | Confirmed |
| Attended days | Working days − approved leave days | Confirmed |
| Who can change it | Admin (see B2.16) | Confirmed |
| History | Previously 3 in the Excel sheet; changed to 5 by the owner | Confirmed |

**What it means** *(Derived)*
- An employee who earns an average of exactly 5 points per attended day
  scores **100%**.
- Approved leave days are **not** in the base, so they never raise the
  requirement.

---

## B2.5 Category points

Current values. All can be changed by the Admin (see B2.16).

| # | Category | Points earned | In base? | Status |
|---|---|---|---|---|
| 1 | On time (up to 9:30) | **6** | Yes | Confirmed |
| 2 | 9:31–9:34 | **4.5** | Yes | Confirmed |
| 3 | 9:35–9:40 | **2** | Yes | Confirmed |
| 4 | After 9:40 | **0** | Yes | Confirmed |
| 5 | Approved leave | **0** | **No**, removed from base | Confirmed |
| — | Holiday / weekly off | Not scored | Not a working day | Confirmed |
| — | Unclassified (missing data) | **Open** | **Open** | Open |

### Notes per category
- **On time = 6.** The only category that earns above the base. Arriving
  earlier than 9:30 earns no extra points. *(Confirmed)*
- **9:31–9:34 = 4.5.** Slightly late; earns just short of the base.
  *(Confirmed)*
- **9:35–9:40 = 2.** Late; earns well short of the base. *(Confirmed)*
- **After 9:40 = 0.** Very late; earns nothing from arrival. *(Confirmed)*
- **Approved leave = 0, removed from base.** The day is not in the base
  requirement, so it has **no effect** on the score. Leave is **neutral**.
  *(Confirmed)*
- **No OT category in version 1.** OT is kept for the next scope (B4). A day
  with overtime earns the points of its arrival band, for example arriving at
  6:30 AM = On time = 6. *(Confirmed)*

---

## B2.6 Notice points

Current values. Both can be changed by the Admin (see B2.16).

| Notice type | Points earned | Status |
|---|---|---|
| Informed by 9:30 | **1.5** extra | Confirmed |
| Informed late | **1** extra | Confirmed |
| Not informed | **0** extra | Confirmed |

### Who can earn notice points

| Category | Can earn notice points? | Status |
|---|---|---|
| 1. On time | **No**: already on time, no need to inform | Confirmed |
| 2. 9:31–9:34 | **No** | Confirmed |
| 3. 9:35–9:40 | **Yes** | Confirmed |
| 4. After 9:40 | **Yes** | Confirmed |
| 5. Approved leave | **No** | Derived (not an arrival day) |

### Rules
- Notice points are **added on top** of category points. *(Confirmed)*
- They **never replace** the category points, so lateness is always still
  reflected. *(Confirmed)*
- **At most one** notice outcome per eligible day: either "by 9:30" or
  "late", never both. *(Derived: each day has one notice outcome)*

---

## B2.7 Complete points per day (all valid combinations)

Every possible score for a single working day, using current values.
*(Derived)*

| Category | Not informed | Informed late (+1 earned) | Informed by 9:30 (+1.5 earned) |
|---|---|---|---|
| 1. On time | **6** | not allowed | not allowed |
| 2. 9:31–9:34 | **4.5** | not allowed | not allowed |
| 3. 9:35–9:40 | **2** | **3** | **3.5** |
| 4. After 9:40 | **0** | **1** | **1.5** |
| 5. Approved leave | **0** (not in base) | not allowed | not allowed |

**There are exactly 9 valid day outcomes:**
6 · 4.5 · 3.5 · 3 · 2 · 1.5 · 1 · 0 · leave (not in base).

---

## B2.8 Each day compared with the base requirement

How each day outcome compares with the base of 5. This explains the
effect of a day; **no points are deducted**. *(Derived, current values)*

| Day outcome | Points earned | Compared with base (5) | If every day were this, the score would be |
|---|---|---|---|
| On time | 6 | 1 point above base | 120% |
| 9:31–9:34 | 4.5 | 0.5 short of base | 90% |
| 9:35–9:40, informed by 9:30 | 3.5 | 1.5 short of base | 70% |
| 9:35–9:40, informed late | 3 | 2 short of base | 60% |
| 9:35–9:40, not informed | 2 | 3 short of base | 40% |
| After 9:40, informed by 9:30 | 1.5 | 3.5 short of base | 30% |
| After 9:40, informed late | 1 | 4 short of base | 20% |
| After 9:40, not informed | 0 | 5 short of base | 0% |
| Approved leave | — | Not in base | No effect |

**What this shows** *(Derived)*
- **Only on-time days earn above the base.**
- **Every late outcome earns short of the base, even with the best notice.**
  Notice narrows the gap but can never bring a late day up to the base.

---

## B2.9 On-time days needed to make up a short day

Each on-time day earns 1 point above the base. This shows how many on-time
days it takes to make up for one short day and bring the total back to the
base. *(Derived, current values)*

| Short day | Short of base by | On-time days needed |
|---|---|---|
| 9:31–9:34 | 0.5 | 0.5 |
| 9:35–9:40, informed by 9:30 | 1.5 | 1.5 |
| 9:35–9:40, informed late | 2 | 2 |
| 9:35–9:40, not informed | 3 | 3 |
| After 9:40, informed by 9:30 | 3.5 | 3.5 |
| After 9:40, informed late | 4 | 4 |
| After 9:40, not informed | 5 | 5 |

---

## B2.10 Points not earned compared with being on time

How many fewer points each outcome earns than an on-time day (6). This is a
comparison only; **nothing is deducted**. *(Derived, current values)*

| Day outcome | Points earned | Fewer points than on time |
|---|---|---|
| 9:31–9:34 | 4.5 | 1.5 |
| 9:35–9:40, informed by 9:30 | 3.5 | 2.5 |
| 9:35–9:40, informed late | 3 | 3 |
| 9:35–9:40, not informed | 2 | 4 |
| After 9:40, informed by 9:30 | 1.5 | 4.5 |
| After 9:40, informed late | 1 | 5 |
| After 9:40, not informed | 0 | 6 |

---

## B2.11 Step sizes between bands

How many fewer points each band earns than the one before it.
*(Derived, current values)*

| From → To | Points earned | Difference |
|---|---|---|
| On time → 9:31–9:34 | 6 → 4.5 | 1.5 fewer |
| 9:31–9:34 → 9:35–9:40 | 4.5 → 2 | 2.5 fewer |
| 9:35–9:40 → After 9:40 | 2 → 0 | 2 fewer |

**What this shows** *(Derived)*
- Each later band earns fewer points, so **very late always earns less than
  slightly late**.
- The **biggest gap** is between 9:31–9:34 and 9:35–9:40 (2.5 points). This
  is also where notice becomes available.

---

## B2.12 Value of notice

| Comparison | Extra points earned | Status |
|---|---|---|
| Informed by 9:30 vs not informed | 1.5 more | Derived |
| Informed late vs not informed | 1 more | Derived |
| Informed by 9:30 vs informed late | 0.5 more | Derived |

**What this shows** *(Derived, current values)*
- Informing early earns more than informing late.
- Notice is always worth less than the gap left by lateness:
  - A 9:35–9:40 day earns 4 fewer points than on time; the best notice
    earns back 1.5.
  - An After-9:40 day earns 6 fewer points than on time; the best notice
    earns back 1.5.
- **Informing helps, but it never makes lateness disappear.**

**Notice never applies to:** on time, 9:31–9:34 or leave days.
*(Confirmed)*

---

## B2.13 Limits: highest and lowest points

Current values.

| Limit | Value | Status |
|---|---|---|
| Highest day points | 6 (on time) | Derived |
| Lowest day points | 0 (After 9:40, not informed) | Derived |
| Highest day points on a late day | 3.5 (9:35–9:40, informed by 9:30) | Derived |
| Negative points | **Never possible** | Confirmed |
| Highest possible monthly score | 120% (every attended day on time) | Derived |
| Lowest possible monthly score | 0% (every attended day After 9:40, not informed) | Derived |
| Monthly score above 100% | Allowed; extra points from on-time days can make up for late days | Confirmed |

---

## B2.14 How points add up over a month (illustrations)

These are **worked examples from the rules using current values, not real
data**. Each uses a month with **26 working days** (base requirement
26 × 5 = **130**) unless stated otherwise. The remaining days are on time.

| # | Month | Total points earned | Base | Score |
|---|---|---|---|---|
| 1 | All 26 on time | 156 | 130 | 120.0% |
| 2 | 25 on time + 1 at 9:31–9:34 | 154.5 | 130 | 118.8% |
| 3 | 25 on time + 1 at 9:35–9:40, not informed | 152 | 130 | 116.9% |
| 4 | 25 on time + 1 at 9:35–9:40, informed by 9:30 | 153.5 | 130 | 118.1% |
| 5 | 25 on time + 1 After 9:40, not informed | 150 | 130 | 115.4% |
| 6 | 25 on time + 1 After 9:40, informed by 9:30 | 151.5 | 130 | 116.5% |
| 8 | 25 on time + 1 approved leave | 150 | 125 | 120.0% |
| 9 | 22 on time + 4 After 9:40, not informed | 132 | 130 | 101.5% |
| 10 | 21 on time + 5 After 9:40, not informed | 126 | 130 | 96.9% |
| 12 | All 26 at 9:31–9:34 | 117 | 130 | 90.0% |

**Notes**
- Example 9 is **accepted by the owner**: 22 on-time days is a strong
  record. *(Confirmed)*
- Examples 7 and 11 (OT) were removed because OT is not part of version 1.
- How the month is actually calculated (one pooled ratio, or an average of
  weekly ratios) is **Open**. These illustrations use one pooled ratio for
  clarity. See *Monthly Score Calculation*.

---

## B2.15 Rules the app must enforce

| # | Rule | Status |
|---|---|---|
| 1 | Points are only earned and added; no points are ever deducted | Confirmed |
| 2 | The same point values apply to every employee | Derived (one table for all in Excel) |
| 3 | Each working day earns category points from exactly one category | Confirmed |
| 4 | Notice points only on 9:35–9:40 and After-9:40 days | Confirmed |
| 5 | No notice points on on time, 9:31–9:34 or leave days | Confirmed |
| 6 | At most one notice outcome per eligible day (by 9:30 **or** late) | Derived |
| 7 | Notice points are added to category points, never replace them | Confirmed |
| 8 | Approved leave days are removed from the base requirement | Confirmed |
| 9 | Each day shows its category points, notice points and day points | Confirmed (each day shows how it was decided) |
| 10 | Changes to a day's points or notice stay visible | Confirmed (changes stay visible) |
| 11 | Only the Admin can change point values | Confirmed |
| 12 | Changes to point values stay visible (old value, new value, when) | Derived (changes stay visible) |

---

## B2.16 Changing point values (Admin)

| Point | Rule | Status |
|---|---|---|
| Who can change point values | **Admin only** | Confirmed |
| Which values can be changed | Base requirement, all five category points, both notice points | Confirmed |
| Who cannot change them | Employees | Confirmed (two roles; Admin makes all decisions) |
| Record of changes | Each change keeps the old value, new value and date of change | Derived (changes stay visible) |
| When a change takes effect (e.g. from next month only, or also recalculating past months) | — | **Open (owner will decide later)** |

**Note** *(Derived)*: the values in this document are the **current** values.
All tables in B2.7–B2.14 use them. If the Admin changes a value, those
tables change accordingly. The rules about **which** categories can earn
notice points, and that points are **never deducted**, are not point values
and do not change.

**For reference:** in Excel, the Admin changes values directly in column A
(for example, A12 was changed from 3 to 5). Excel keeps no record of the
change, and it immediately changes every score in the sheet.

---

## B2.17 How this maps to the current Excel sheet

**For reference only.** All point values are in **one table** in column A of
the sheet "Punctuality-Arrival", used by every employee block.

| Cell | Value | Label (column B) | Meaning in these rules |
|---|---|---|---|
| A12 | 5 | ARRIVAL | Base requirement per attended day |
| A13 | 6 | 9.30 | On time |
| A14 | 4.5 | 9.34 | 9:31–9:34 |
| A15 | 2 | 9.4 | 9:35–9:40 |
| A16 | 0 | After 9.40 | After 9:40 |
| A17 | 0 | Leave Taken | Approved leave |
| A18 | 5 | Night OT (NOT) | Not used in version 1 (OT is next scope) |
| A19 | 5 | Morning OT (MOT) | Not used in version 1 (OT is next scope) |
| A20 | 1.5 | Inform BY 9.30 | Notice by 9:30 |
| A21 | 1 | late inform | Notice late |

**How Excel uses them** (first employee block, week W-1)
- Points earned per row: `J13 = $A13*I13`, copied down to row 21.
- Total points earned: `J23 = SUM(J13:J22)`. Points are only added.
- Base requirement: `I10 = I9*$A$12`.

**Where Excel differs from these rules**

| # | Excel behaviour | This document |
|---|---|---|
| 1 | Notice is entered as a count with no link to eligible days | Notice only on 9:35–9:40 and After-9:40 days, one per day |
| 2 | A pink check exists only on week W-1's "by 9:30" cell, always compares against the first employee's cells, and ignores late notice | Every eligible day checked for every employee |
| 3 | Night OT and Morning OT rows exist with their own points | No OT category in version 1; a day with overtime earns the points of its arrival band |
| 4 | A blank day effectively earns 0 and stays in the base | Unclassified scoring is Open |
| 5 | Points are counts × values; no per-day record | Each day shows its own points |
| 6 | Changing a value in column A leaves no record | Changes to point values stay visible |

---

## B2.18 Decisions log (this document)

| # | Decision | Status |
|---|---|---|
| 1 | Points are only earned and added; never deducted | Confirmed |
| 2 | Base requirement is 5 per attended day (changed from 3); it is not a pass mark | Confirmed |
| 3 | Category points: 6 / 4.5 / 2 / 0 / 0 (leave) | Confirmed |
| 4 | Notice points: 1.5 by 9:30, 1 late | Confirmed |
| 5 | Notice only on 9:35–9:40 and After-9:40 days | Confirmed |
| 6 | No notice on on time or 9:31–9:34 days | Confirmed |
| 7 | OT is removed from version 1 and kept strictly for the next scope (B4); a day with overtime earns the points of its arrival band | Confirmed |
| 8 | Arriving earlier than 9:30 earns no extra points | Confirmed |
| 9 | Scores above 100% are allowed; extra points from on-time days can make up for late days | Confirmed |
| 10 | The Admin can change point values | Confirmed |
| 11 | No reasons for the point values are needed for now | Confirmed |

---

## B2.19 Open items

| # | Item | Status |
|---|---|---|
| 1 | When a change to point values takes effect (from next month only, or also recalculating past months) | Open (owner will decide later) |
| 2 | Points for unclassified (missing) days | Open |
| 3 | Points for days affected by attendance-system failures | Open (owner will decide later) |
| 4 | Monthly calculation method: pooled ratio or average of weekly ratios | Open (covered in Monthly Score Calculation) |