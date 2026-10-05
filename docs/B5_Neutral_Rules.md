# Part B5 — Neutral Days Rules
**Punctuality Scoring System — Documentation Set**
Version 1.1 (Final — Version 1 scope)

---

## Contents
- B5.0 About this document
- B5.1 Status labels used in this document
- B5.2 Key terms
- B5.3 What "neutral" means
- B5.4 The neutral day types
- B5.5 Approved leave
- B5.6 Holidays and weekly offs
- B5.7 How neutral days affect the base requirement
- B5.8 Why neutral days never hurt the score
- B5.9 Missing data and attendance-system failures
- B5.10 Examples
- B5.11 Month illustrations
- B5.12 Test cases
- B5.13 Edge cases
- B5.14 Rules the app must enforce
- B5.15 Who does what
- B5.16 Deferred system problems
- B5.17 Out of scope for version 1
- B5.18 How this maps to the current Excel sheet
- B5.19 Decisions log (this document)
- B5.20 Open items

---

## B5.0 About this document

### Purpose
This document defines the **neutral days**: days that must **never hurt**
an employee's score. It explains what each neutral day type is, who marks
it, and exactly how it is removed from the calculation.

### Scope
**Covered here**
- Approved leave
- Holidays and weekly offs
- How each affects working days, attended days and the base requirement
- Where missing data and system failures stand (not yet decided)

**Covered in other documents**

| Topic | Document |
|---|---|
| How a day is classified | B1 Day Classification Rules |
| Point values | B2 Points Table |
| Notice | B3 Notice (Inform) Rules |
| OT (not in version 1; next scope only) | B4 OT Rules |
| Monthly calculation | Monthly Score Calculation |

### Source of truth
Where this document and the current Excel sheet differ, **this document
wins**.

---

## B5.1 Status labels used in this document

| Label | Meaning |
|---|---|
| **Confirmed** | Decided by the owner |
| **Derived** | Follows directly from confirmed rules |
| **Deferred** | Known problem; to be worked on later |
| **Out of scope** | Not part of version 1 |
| **Open** | Not yet decided |

---

## B5.2 Key terms

| Term | Meaning |
|---|---|
| Neutral day | A day that neither raises nor lowers the monthly score |
| Approved leave | A full working day the employee does not come to work; all leave is approved |
| Holiday | A non-working day set by the Admin |
| Weekly off | A regular non-working day, set by the Admin **per employee** |
| Calendar days | All days in the month |
| Working days | Calendar days − holidays − that employee's weekly offs |
| Attended days | Working days − approved leave days |
| Base requirement | Attended days × 5 (current value) |

---

## B5.3 What "neutral" means

> A neutral day is **taken out of the calculation**. It earns nothing and
> requires nothing, so the score is the same as if that day did not exist.
> *(Confirmed: owner goal "approved leave, holidays, weekly offs … must not
> hurt anyone")*

- Points are only earned, never deducted (B2). *(Confirmed)*
- A neutral day is removed from the **days**, not from the points.
  *(Derived)*

---

## B5.4 The neutral day types

| Type | Working day? | Classified? | Points | In base requirement? | Removed at which step | Status |
|---|---|---|---|---|---|---|
| Holiday | No | No | — | No | Calendar days → working days | Confirmed |
| Weekly off | No | No | — | No | Calendar days → working days | Confirmed |
| Approved leave | Yes | Yes (category 5) | 0 | **No** | Working days → attended days | Confirmed |

**The difference** *(Derived)*
- Holidays and weekly offs are **not working days at all**.
- Approved leave **is** a working day, but the employee is excused, so it is
  taken out of the base requirement.
- Both end with the same effect: **no effect on the score**.

---

## B5.5 Approved leave

| Point | Rule | Status |
|---|---|---|
| Meaning | The employee does not come to work for the **whole** working day | Confirmed |
| Approval | **All leave is approved**; there is no "unapproved leave" | Confirmed |
| Absent without informing | Still recorded as **approved leave** in version 1 | Confirmed |
| Who marks it | Admin | Confirmed |
| Category | Category 5: Approved leave (B1) | Confirmed |
| Points | 0 | Confirmed |
| Informing / notice | **Does not count** for leave days in version 1; notice applies only to 9:35–9:40 and After 9:40 (B3) | Confirmed |
| Base requirement | Removed (not an attended day) | Confirmed |
| Effect on score | None | Derived |
| Checked before arrival time | Yes (B1 decision step 2) | Derived |
| Limit on leave days per month | **None** in version 1 | Confirmed |
| Leave reason | **Not recorded** in version 1 | Confirmed |
| Half-day leave | Not in version 1 | Out of scope |

---

## B5.6 Holidays and weekly offs

| Point | Rule | Status |
|---|---|---|
| Meaning | Days that are not working days | Confirmed |
| Weekly offs | **Can differ per employee**; each employee can have their own weekly off(s) | Confirmed |
| Holidays | Set by the Admin. Whether holidays can also differ per employee is **Open** | Open |
| Who sets them | Admin | Confirmed |
| Classified | No category | Confirmed |
| Scored | No | Confirmed |
| Effect on working days | Removed, for that employee | Confirmed |
| Effect on score | None | Derived |
| Working days per employee | Can differ between employees in the same month, because weekly offs differ | Derived |
| Employee works on a holiday or weekly off | Can happen, but not handled in version 1 | Out of scope |
| Holiday vs weekly off | Treated the same for scoring | Derived |

---

## B5.7 How neutral days affect the base requirement

Worked out **per employee**. *(Confirmed formulas)*

```
Calendar days
  − Holidays
  − This employee's weekly offs
  = Working days (this employee)
  − Approved leave days
  = Attended days
  × 5 (base per attended day)
  = Base requirement
```

| Step | Removes | Result |
|---|---|---|
| 1 | Holidays, the employee's weekly offs | Working days |
| 2 | Approved leave days | Attended days |
| 3 | — | Base requirement = attended days × 5 |

---

## B5.8 Why neutral days never hurt the score

*(Derived, current values)*

- A neutral day adds **0 points** and **0 base requirement**.
- So total points ÷ base requirement is unchanged.

| Month | Total points | Base | Score |
|---|---|---|---|
| 20 attended days, all on time | 120 | 100 | 120.0% |
| Same + 3 approved leave days | 120 | 100 | 120.0% |
| Same + 2 extra holidays | 120 | 100 | 120.0% |

The score is identical in all three. *(Derived)*

---

## B5.9 Missing data and attendance-system failures

| Point | Rule | Status |
|---|---|---|
| Owner goal | Attendance-system failures must not hurt anyone; missing data must not be treated as bad behaviour | Confirmed |
| Current Excel behaviour | A blank day earns 0 but stays in the base, so it is treated like "After 9:40, not informed" | Confirmed (observed) |
| That Excel behaviour is the intended rule | **No** | Confirmed |
| Whether these days become neutral (like leave) or are handled another way | — | **Open (owner will decide later)** |
| How the app flags them | — | Deferred (B1) |

**Note:** an employee who is absent (does not come) is recorded as
approved leave (B5.5). A missing record is different: the day is a working
day with **nothing recorded at all**. That case is still Open.

---

## B5.10 Examples

One day each.

| # | Situation | Working day? | Category | Points | In base? |
|---|---|---|---|---|---|
| 1 | Public holiday | No | Not classified | — | No |
| 2 | This employee's weekly off | No | Not classified | — | No |
| 3 | Another employee's weekly off (not this employee's) | Yes, for this employee | Classified normally | Normal | Yes |
| 4 | Approved leave | Yes | Approved leave | 0 | No |
| 5 | Absent without informing | Yes | Approved leave | 0 | No |
| 6 | Leave with a notice time recorded | Yes | Approved leave | 0 (notice does not count) | No |
| 7 | Approved leave, but an arrival time also recorded | Yes | Deferred system problem (B1) | — | — |
| 8 | Arrival recorded on the employee's weekly off | No | Deferred system problem (B1); holiday work out of scope | — | — |
| 9 | Working day, nothing recorded | Yes | Unclassified | Open | Open |
| 10 | Half-day leave | — | Not handled | Out of scope | — |

---

## B5.11 Month illustrations

Worked from the rules using current values, **not real data**. A 30-day
month. The other days are on time.

| # | Month | Working | Leave | Attended | Base | Points | Score |
|---|---|---|---|---|---|---|---|
| 1 | 4 weekly offs, no leave, all on time | 26 | 0 | 26 | 130 | 156 | 120.0% |
| 2 | 4 weekly offs, 1 leave, rest on time | 26 | 1 | 25 | 125 | 150 | 120.0% |
| 3 | 4 weekly offs, 5 leave, rest on time | 26 | 5 | 21 | 105 | 126 | 120.0% |
| 4 | 4 weekly offs + 1 holiday, all on time | 25 | 0 | 25 | 125 | 150 | 120.0% |
| 5 | 4 weekly offs, 1 leave + 1 After 9:40 not informed | 26 | 1 | 25 | 125 | 144 | 115.2% |
| 6 | 4 weekly offs, no leave + 1 After 9:40 not informed | 26 | 0 | 26 | 130 | 150 | 115.4% |
| 7 | 5 weekly offs (different employee), all on time | 25 | 0 | 25 | 125 | 150 | 120.0% |

**Notes** *(Derived)*
- Examples 5 and 6 differ slightly (115.2% vs 115.4%) because one late day
  weighs a little more in a month with fewer attended days. Leave itself
  has no effect.
- Examples 1 and 7: two employees with different numbers of weekly offs
  both score 120% when always on time. Different weekly offs don't make
  one employee look better than another.

---

## B5.12 Test cases

*(Derived)*

| Input | Expected result |
|---|---|
| Day marked holiday | Not a working day; not scored |
| Day is this employee's weekly off | Not a working day for this employee; not scored |
| Day is another employee's weekly off | Normal working day for this employee |
| Day marked approved leave | Category 5; 0 points; removed from base |
| Absent without informing | Approved leave; 0 points; removed from base |
| Approved leave with notice time | Notice does not count; time kept (B3); 0 |
| Leave and arrival both recorded | Deferred system problem |
| Arrival on holiday or the employee's weekly off | Deferred system problem; not scored |
| Month with leave on every working day | Base = 0; score cannot be calculated (Open) |

---

## B5.13 Edge cases

| # | Case | Status |
|---|---|---|
| 1 | **Every working day of the month is leave**: base requirement = 0, so the score cannot be divided | Open |
| 2 | **A whole week is leave**: in Excel this gives #DIV/0! for that week. In the app it depends on the monthly method (pooled ratio or weekly average) | Accepted edge case; handling Open |
| 3 | Holiday falls on an employee's weekly off | Open (counted once?) |
| 4 | Employee joins or leaves partway through the month | Open |

---

## B5.14 Rules the app must enforce

| # | Rule | Status |
|---|---|---|
| 1 | Holidays and weekly offs are not working days and are never scored | Confirmed |
| 2 | Weekly offs are stored **per employee** | Confirmed |
| 3 | Working days are worked out per employee | Derived |
| 4 | Approved leave is removed from the base requirement | Confirmed |
| 5 | Neutral days never earn or lose points | Confirmed |
| 6 | Only the Admin marks leave, holidays and weekly offs | Confirmed |
| 7 | All leave is treated as approved, including absence without informing | Confirmed |
| 8 | Notice never counts on a leave day | Confirmed |
| 9 | Leave is for a whole day only | Confirmed (half-day out of scope) |
| 10 | No limit on leave days; no leave reason recorded | Confirmed |
| 11 | Leave is checked before arrival time | Derived |
| 12 | Each neutral day shows how it was decided (e.g. "Marked by Admin: Approved leave") | Confirmed |
| 13 | Changes to neutral days stay visible | Confirmed |

---

## B5.15 Who does what

| Task | Employee | Admin |
|---|---|---|
| Take leave / be absent | ✔ | |
| Mark approved leave | | ✔ |
| Set holidays | | ✔ |
| Set each employee's weekly off(s) | | ✔ |
| Correct a neutral-day record (change stays visible) | | ✔ |

---

## B5.16 Deferred system problems

From B1. *(Deferred)*

| # | Problem |
|---|---|
| 1 | A leave day that also has an arrival time |
| 2 | An arrival time recorded on a holiday or the employee's weekly off |
| 3 | A working day with nothing recorded |

---

## B5.17 Out of scope for version 1

| Item | Status |
|---|---|
| Half-day leave | Out of scope |
| Leave limits and leave reasons | Out of scope |
| Informing for leave days | Out of scope (does not count for now) |
| Working on a holiday or weekly off | Out of scope |
| OT | Next scope (B4) |

---

## B5.18 How this maps to the current Excel sheet

**For reference only.** Sheet "Punctuality-Arrival".

| Item | Excel |
|---|---|
| Days per week | B4:E4 (7, 7, 7, 9) |
| Holidays per week | B5:E5 (1 each), same for all employees |
| Working days | Row 7: `=$B$4-$B$5` |
| Leave taken | Row 17 (count), copied to row 8: `=I17` |
| Attended days | Row 9: `=I7-I17` |
| Base requirement | Row 10: `=I9*$A$12` |
| Leave points | A17 = 0 |

**Where Excel differs from these rules**

| # | Excel behaviour | This document |
|---|---|---|
| 1 | Holidays and weekly offs are one combined count per week | Admin sets each holiday, and each employee's weekly offs |
| 2 | Same non-working days for every employee (B5:E5) | Weekly offs per employee |
| 3 | Leave is a weekly count, not linked to dates | Leave marked per day |
| 4 | A week of full leave gives #DIV/0! | Edge case; handling Open |
| 5 | A blank day stays in the base | Missing-data handling Open |

---

## B5.19 Decisions log (this document)

| # | Decision | Status |
|---|---|---|
| 1 | Approved leave, holidays and weekly offs must never hurt the score | Confirmed |
| 2 | All leave is approved | Confirmed |
| 3 | Absent without informing is recorded as approved leave in version 1 | Confirmed |
| 4 | Informing does not count for leave days in version 1 | Confirmed |
| 5 | No limit on leave days and no leave reason in version 1 | Confirmed |
| 6 | Leave is removed from the base requirement | Confirmed |
| 7 | Weekly offs can differ per employee | Confirmed |
| 8 | Holidays and weekly offs are removed from working days | Confirmed |
| 9 | The Admin marks leave, holidays and weekly offs | Confirmed |
| 10 | Half-day leave is out of scope | Confirmed |
| 11 | Working on holidays is out of scope | Confirmed |
| 12 | A full week of leave causing an error is an accepted edge case for now | Confirmed |

---

## B5.20 Open items

| # | Item | Status |
|---|---|---|
| 1 | Can holidays (not weekly offs) also differ per employee? | Open |
| 2 | Score when every working day of the month is leave | Open |
| 3 | Holiday falling on an employee's weekly off | Open |
| 4 | Employees joining or leaving mid-month | Open |
| 5 | Missing data and attendance-system failures | Open (owner will decide later)