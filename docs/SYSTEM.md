# Part A — The System
**Punctuality Scoring System — Documentation Set**
Version 1.2 (Final — Version 1 scope)

---

## Contents
- A0. About this document
- A1. System Overview
- A2. Design Principles (including priority order)
- A3. Process Flow / Workflow
- A4. Current Excel Implementation (reference)
- A5. Decisions Log
- A6. Open Items
- A7. Out of Scope for Version 1
- A8. Glossary

---

## A0. About this document

### A0.1 Purpose of this document
This document explains **what the system is, why it exists, the principles it
follows and how it is run**. It is written for a developer or AI who has never
seen the system and must understand it before building an app.

### A0.2 How this document fits into the set
This is **Part A** of the documentation set. The detailed rules live in
separate documents:

| Document | Covers |
|---|---|
| B1 Day Classification Rules | Exact time boundaries and which category a day falls into |
| B2 Points Table | Points for every category and notice outcome |
| B3 Notice (Inform) Rules | Who can earn notice points, how and when |
| B4 OT Rules | **Out of scope for version 1**; holds OT decisions for the next scope |
| Neutral Days Rules | Leave, holidays and weekly offs |
| Monthly Score Calculation | Step-by-step monthly calculation |
| Incentive Mapping | How the score becomes an incentive (thresholds not yet decided) |
| Worked Examples, Edge Cases, Anti-Gaming Notes, Glossary, Decisions Log, Open Questions | Supporting material |

Part A summarises the rules only as far as needed to understand the system.
Where Part A and a detailed rules document differ, **the detailed rules
document wins**.

### A0.3 Source of truth
The rules in this documentation set are the source of truth.
The existing Excel workbook is a **reference only**. It has known gaps
(see A4.5) that must **not** be copied into the app.

### A0.4 Version scope
This document describes **version 1** of the app.
**OT (overtime) is not part of version 1.** It is kept strictly for the next
scope (see A7 and B4).

---

## A1. System Overview

### A1.1 Purpose
- A factory with about **20 employees**.
- Official reporting time: **9:30 AM**.
- The system gives each employee a **monthly punctuality score** from their
  daily attendance.
- The monthly score will later decide **incentives** (examples given:
  **Rs 2,000** and **Rs 500**). Thresholds are **not yet decided**.

**Problem it solves:** a fair, consistent and explainable way to reward
punctuality, where the Admin can explain every employee's result from their
daily records.

### A1.2 Scope: what is measured, and what is not

| Measured | Not measured |
|---|---|
| Arrival time compared with 9:30 AM | Amount of work done |
| Whether a late arrival (9:35 or later) was notified, and when | Output, productivity or quality |
| Neutral days: approved leave, holidays, weekly offs | Hours worked or overtime |

**Key point:** the system measures **punctuality only**. An employee arriving
at 9:29 AM earns the full on-time points. Arriving earlier gives no extra
punctuality credit.

**OT in version 1:** there is no OT category. A day on which an employee
does overtime is classified **by its arrival time**, like any other day.
For example, arriving at 6:30 AM for overtime is **On time** and earns
**6 points**.

### A1.3 Roles
The system has exactly **two roles**.

| Role | What they do | What they don't do |
|---|---|---|
| **Employee** | Arrives for work; may inform the Admin when late; is scored | Does not enter or change records |
| **Admin** | Records arrival times; records notice times; marks leave, holidays and weekly offs; checks and closes the month; reviews scores; decides incentives; explains results; changes point values; decides cases the rules don't cover | — |

### A1.4 The building blocks

**1. Day categories.** Every **working day** of an employee falls into
**exactly one** of **five** categories. Arrival is judged **by the minute**;
seconds are ignored.

| # | Category | Rule | Points |
|---|---|---|---|
| 1 | On time | Arrival minute 9:30 or earlier | 6 |
| 2 | 9:31–9:34 | Arrival minute 9:31 to 9:34 | 4.5 |
| 3 | 9:35–9:40 | Arrival minute 9:35 to 9:40 | 2 |
| 4 | After 9:40 | Arrival minute 9:41 or later | 0 |
| 5 | Approved leave | On approved leave (all leave is approved) | 0, and the day is removed from the base requirement |

Examples: 9:30:59 = On time; 9:34:30 = 9:31–9:34; 9:40:30 = 9:35–9:40.

**2. Notice (inform) points.** Extra points that only categories **3**
(9:35–9:40) and **4** (After 9:40) can earn:

| Notice outcome | When | Points added |
|---|---|---|
| Informed by 9:30 | Notice minute 9:30 or earlier | +1.5 |
| Informed late | Notice minute after 9:30 **and** before the arrival minute | +1 |
| Not informed | No notice, or notice at or after the arrival minute | 0 |

- Notice points are **added on top**. They never remove or replace the
  lateness.
- On time, 9:31–9:34 and leave days **never** get notice points.
- Notice must be given **on the same day**, **before arriving**.
- An eligible day has **at most one** notice outcome.
- The Admin records the **notice time**; the app works out the outcome.

**3. Points per day, all valid combinations**

| Category | Not informed | Informed late | Informed by 9:30 |
|---|---|---|---|
| On time | 6 | not allowed | not allowed |
| 9:31–9:34 | 4.5 | not allowed | not allowed |
| 9:35–9:40 | 2 | 3 | 3.5 |
| After 9:40 | 0 | 1 | 1.5 |
| Approved leave | 0 (not in base) | not allowed | not allowed |

There are **9 valid day outcomes**: 6 · 4.5 · 3.5 · 3 · 2 · 1.5 · 1 · 0 ·
leave (not in base).

**4. Base requirement.** **5 points per attended day** (current value).
This is a **base requirement**, not a pass mark.

**5. Points are only earned, never deducted.** Late days simply earn fewer
points. There are no penalties or negative points.

**6. Monthly score.**
- Working days = calendar days − holidays − weekly offs
- Attended days = working days − approved leave days
- Base requirement = attended days × 5
- **Monthly score = total points ÷ base requirement**

### A1.5 End-to-end flow

```
1. Daily attendance recorded (arrival time, or leave status; notice time if any)
        ↓
2. Day placed in exactly one of five categories (by the minute)
        ↓
3. Category points assigned  (+ notice points, only for 9:35–9:40 / After 9:40)
        ↓
4. All points for the month added up            → Total points
5. Attended days × 5                            → Base requirement
        ↓
6. Total points ÷ Base requirement              → Monthly score (%)
        ↓
7. Monthly score compared with thresholds       → Incentive (thresholds not yet decided)
```

Only the **monthly score** is an output that matters. Any weekly figures
(as in the current Excel sheet) are just a way of entering data.

### A1.6 Reading the monthly score

| Score | Meaning |
|---|---|
| 120% | Every attended day on time (the maximum) |
| 100% | Exactly meets the base requirement |
| Below 100% | Below the base requirement |

What each day outcome does on its own, compared with its base of 5
(worked out from the points table; nothing is deducted):

| Day outcome | Points earned | Compared with base (5) | If every day were this |
|---|---|---|---|
| On time | 6 | 1 above base | 120% |
| 9:31–9:34 | 4.5 | 0.5 short of base | 90% |
| 9:35–9:40, informed by 9:30 | 3.5 | 1.5 short of base | 70% |
| 9:35–9:40, informed late | 3 | 2 short of base | 60% |
| 9:35–9:40, not informed | 2 | 3 short of base | 40% |
| After 9:40, informed by 9:30 | 1.5 | 3.5 short of base | 30% |
| After 9:40, informed late | 1 | 4 short of base | 20% |
| After 9:40, not informed | 0 | 5 short of base | 0% |
| Approved leave | — | Not in base | No effect |

**Illustration (worked from the rules, not real data).**
A month with **26 working days** and no leave, so the base requirement is
26 × 5 = **130**. The other days are on time.

| Month | Total points | Score |
|---|---|---|
| All 26 days on time | 156 | 120.0% |
| 25 on time + 1 day at 9:31–9:34 | 154.5 | 118.8% |
| 25 on time + 1 day at 9:35–9:40, not informed | 152 | 116.9% |
| 25 on time + 1 day After 9:40, informed by 9:30 | 151.5 | 116.5% |
| 25 on time + 1 day After 9:40, not informed | 150 | 115.4% |
| 25 on time + 1 approved leave (base = 125) | 150 | 120.0% |
| 22 on time + 4 After 9:40, not informed | 132 | 101.5% |

The last row is **accepted by the owner**: being on time on 22 days is
considered a strong record.

### A1.7 Inputs and outputs

**Inputs per employee, per day**
- Arrival time (to the minute), **or** approved leave status
- Notice time (to the minute), if the employee informed

**Inputs per month**
- Calendar days in the month
- Holidays and weekly offs

**Outputs per employee, per month**
- Count of days in each category
- Notice points earned
- Total points
- Attended days and base requirement
- Monthly score (%)
- Incentive result (once thresholds are set)

### A1.8 Current state and target state

**Current state: manual, in Excel**
- The Admin does all entry **by hand**.
- The sheet **"Punctuality-Arrival"** holds **weekly counts** of days per
  category for each employee (weeks W-1 to W-4). It does not store daily
  arrival or notice times.
- The sheet works out a weekly ratio and averages the four weeks into a
  monthly score. See A4.

**Target state: app (version 1)**
- Stores **one record per employee per day**.
- Will **derive as much as possible automatically from minimal input**
  (for example, working out the category from the arrival time, and the
  notice outcome from the notice time). Exactly which inputs is still open
  (A6).
- Applies all rules and validations automatically.
- Produces a monthly score that can be traced back to each daily record.

---

## A2. Design Principles

These are the owner's five goals. Each one is stated as a principle, followed
by how the current rules meet it and what the app must keep true.

### A2.1 Explainable
**Principle:** every score can be traced back to specific daily records, and
the Admin can say exactly why someone got their score.

**How the rules support it**
- Fixed points per category.
- One simple formula: total points ÷ base requirement.
- Categories and notice outcomes are worked out from recorded times, not
  typed in.

**The app must keep true**
- Store **every day** as its own record, not just weekly totals.
- Each day shows how it was decided, for example "Arrived 9:47, informed 9:22
  → 9:35–9:40 + informed by 9:30 = 3.5 points".
- Show a per-employee breakdown: each day's category, points, notice points,
  attended days, base requirement and monthly score.
- Every change by the Admin stays visible on the record it affects.

**Current gap:** the Excel sheet stores only weekly counts, so a score cannot
be traced to particular dates.

### A2.2 Neutral where it should be
**Principle:** approved leave, holidays, weekly offs and attendance-system
failures must not hurt anyone. Missing data must not be treated as bad
behaviour.

**How the rules support it**
- Approved leave is removed from the base requirement (all leave is approved).
- Holidays and weekly offs are removed from working days.

**The app must keep true**
- Neutral days must never reduce a score.

**Current gap**
- In Excel, a blank or missing day scores 0 but still counts in the base
  requirement, so it is treated the same as "After 9:40, not informed".
- How to handle **system failures** and **missing data** is **Open** (A6).

### A2.3 Fair
**Principle:** one bad day should not destroy an otherwise excellent month,
but repeated lateness adds up, and very late costs more than slightly late.

**How the rules support it**
- Each day is scored separately and points build up over the month, so one
  late day has a small effect (see A1.6).
- Points fall in steps: 6 → 4.5 → 2 → 0.
- Each late day counts again, so repeated lateness adds up.

**The app must keep true**
- Every late day is counted; none are dropped, merged or capped away.

### A2.4 Hard to game
**Principle:** informing the Admin helps, but must never make lateness
disappear.

**How the rules support it**
- Notice points are small (at most 1.5 extra per day).
- Only 9:35–9:40 and After-9:40 days can earn them.
- They are added to the arrival points and never replace them. Even with the
  best notice, a 9:35–9:40 day (3.5) and an After-9:40 day (1.5) stay short
  of the base of 5.
- Only notice given on the same day and before arriving counts.
- Notice outcomes are worked out from recorded times, so they can't be typed
  in to contradict the records.

**The app must enforce**
1. Exactly one category per working day.
2. Notice points only on 9:35–9:40 and After-9:40 days.
3. No notice points on on-time, 9:31–9:34 or leave days (any notice time is
   kept on the record but earns 0).
4. At most one notice time per day.
5. Notice counts only if its minute is before the arrival minute.

**Current gap:** the Excel sheet does not enforce rules 2–5. It only has a
partial highlight check (see A4.4).

### A2.5 Simple
**Principle:** simple enough for a factory admin to run.

**How the rules support it**
- Five categories, a fixed points table, one formula.

**The app must keep true**
- The Admin only enters or confirms daily facts (times and leave). Every
  calculation is automatic.
- Manual entry is kept as small as possible (target state).

### A2.6 Summary: principles mapped to rules

| Principle | Main rules that deliver it |
|---|---|
| Explainable | Fixed points table; one formula; one record per day; outcomes worked out from times |
| Neutral | Leave removed from base; holidays/offs removed from working days |
| Fair | Graded points 6 / 4.5 / 2 / 0; each day scored and added up |
| Hard to game | Notice only for 9:35+; added, never replaces; before arriving only; validation rules |
| Simple | Five categories; automatic calculation |

### A2.7 Priority order when principles conflict

When a new situation isn't covered by the rules, the **Admin** decides by
applying the principles in this order.

**Gate (must always hold): Explainable.**
Any decision must be one the Admin can write down and explain from the daily
records. If a decision can't be explained, it isn't allowed, whichever other
principle it serves.

**Then, in priority order:**

| Priority | Principle | Why it ranks here |
|---|---|---|
| 1 | **Neutral where it should be** | The score decides money. Penalising someone for something outside their control (leave, holidays, system failures, missing data) is the most damaging error, and the owner made it an explicit requirement. |
| 2 | **Fair** | Once outside factors are removed, the score should reflect real punctuality in proportion: one bad day matters a little, repeated or very late arrivals matter more. |
| 3 | **Hard to game** | Rules must not be open to exploitation, but protecting against gaming should not come at the cost of punishing honest employees (priorities 1 and 2). |
| 4 | **Simple** | Simplicity matters for running the system day to day, but it should not override accuracy or fairness. |

**How to use it**
- Check the gate first: can the decision be explained from records?
- If two principles point different ways, the higher priority wins.
- Record every such decision and the reason, so that future cases are handled
  the same way (see A5, Decisions Log).

**Example of the order in use (guidance only; the actual rule is still Open):**
for a day missing because of an attendance-system failure, *Neutral*
(priority 1) says the employee should not be penalised. That outweighs
*Hard to game* (priority 3), which might suggest treating blanks strictly.
The gate still applies: the Admin must record why the day was treated as
neutral.

---

## A3. Process Flow / Workflow

### A3.1 Daily process

| Step | What happens | Who | Current (manual) | Target (app) |
|---|---|---|---|---|
| 1 | Employee arrives (or is on approved leave) | Employee | — | — |
| 2 | If running late, the employee may inform the Admin (same day, before arriving) | Employee → Admin | — | — |
| 3 | Notice time recorded (to the minute) | Admin | Manual (counted into weekly totals) | Admin records; app works out the outcome |
| 4 | Arrival time recorded (to the minute) | Admin | Manual | Derived automatically where possible |
| 5 | Leave days marked | Admin | Manual | Admin marks |
| 6 | Day given exactly one category | Admin | Manual (counted into weekly totals) | Automatic from arrival time or leave status |
| 7 | Notice points applied (eligible days only) | — | Manual | Automatic |

### A3.2 Monthly process

| Step | What happens | Who | Current (manual) | Target (app) |
|---|---|---|---|---|
| 1 | Set calendar days, holidays and weekly offs for the month | Admin | Manual (per week in Excel) | Admin sets once per month |
| 2 | Check every working day has exactly one category | Admin | Red highlight in Excel (A4.4) | App checks automatically |
| 3 | Close (lock) the month | Admin | Manual | Admin locks the month |
| 4 | Calculate monthly scores | System | Excel formulas | Automatic |
| 5 | Review scores | Admin | Manual | Admin reviews breakdowns |
| 6 | Decide incentives | Admin | Manual | Automatic once thresholds are set; Admin approves |
| 7 | Explain results to employees if asked | Admin | Manual | From the per-employee daily breakdown |

### A3.3 Decisions outside the rules
Any case the rules don't cover is decided by the **Admin**, using the
priority order in A2.7, and recorded with its reason.

---

## A4. Current Excel Implementation (reference)

**For reference only.** It describes how the existing sheet
**"Punctuality-Arrival"** works so that results can be compared. It is not
the specification.

### A4.1 Sheet-level settings

| Cell(s) | Content |
|---|---|
| B2 | Month |
| B4:E4 | Days in each week W-1 to W-4 (currently 7, 7, 7, 9) |
| F4 | Total days: `=SUM($B$4:$E$4)` |
| B5:E5 | Holidays per week (currently 1 each), applied to all employees |
| A12 | Base requirement per attended day (5) |
| A13:A21 | Points for each row (6, 4.5, 2, 0, 0, 5, 5, 1.5, 1) |

### A4.2 Employee blocks
- Each employee has an **11-column block** (the first block is I:S, the next
  is T:AD, and so on).
- Each week has a **count column** and a **points column** next to it (for
  the first block: I/J, K/L, M/N, O/P).

| Row | Meaning |
|---|---|
| 7 | Working days = days in week − holidays |
| 8 | Leave taken (copied from row 17) |
| 9 | Attended days = working days − leave |
| 10 | Base requirement = attended days × A12 |
| 11 | Employee name |
| 13–16 | Counts of on time / 9:31–9:34 / 9:35–9:40 / After 9:40 days |
| 17 | Leave taken |
| 18–19 | Night OT / Morning OT (**not used in version 1**) |
| 20–21 | Notice by 9:30 / notice late (counts) |
| 23 | Days counted (rows 13–19) and total points (rows 13–21) |
| 24 | Weekly ratio = total points ÷ base requirement |
| 26–28 | Running averages for 1, 2 and 3 weeks |
| 29 | Monthly score = average of the four weekly ratios |

### A4.3 Key formulas (first block)

| Cell | Formula |
|---|---|
| I7 | `=$B$4-$B$5` |
| I9 | `=I7-I17` |
| I10 | `=I9*$A$12` |
| J13 (copied down to J21) | `=$A13*I13` |
| I23 | `=SUM(I13:I19)` |
| J23 | `=SUM(J13:J22)` |
| I24 | `=J23/I10` |
| O29 | `=(I24+K24+M24+O24)/4` |

### A4.4 Built-in checks
- **Row 23 (red):** highlights when the days counted don't equal the working
  days in row 7.
- **Notice check (pink):** on week W-1's notice-points cell only, it
  highlights when notice points ≠ (9:35–9:40 days + After-9:40 days) × 1.5.
  It refers to the first employee's cells in every block, and it ignores
  late-notice entries.

### A4.5 Known gaps (must not be copied into the app)
1. Only weekly counts are stored, so scores cannot be traced to dates.
2. Nothing stops more notice entries than eligible days, or notice on
   ineligible days.
3. Notice outcome is chosen by hand; there is no notice time or arrival time
   to check it against.
4. A blank or missing day scores 0 but stays in the base requirement.
5. A week where every working day is leave gives a calculation error
   (#DIV/0!). This is accepted as an edge case for now.
6. The monthly score is an unweighted average of weekly ratios, so a
   short week counts the same as a long one.
7. Holidays are one number per week for everyone.
8. There is no single results table or incentive output.
9. OT rows (18–19) exist in the sheet, but OT is not part of version 1.
   In version 1, those days are classified by arrival time.
10. Changing a point value in column A leaves no record of the change.

---

## A5. Decisions Log

Decisions confirmed by the owner during review:

| # | Decision |
|---|---|
| 1 | The system measures punctuality only, not the amount of work. |
| 2 | Only the monthly score matters; weekly figures are just for data entry. |
| 3 | The base requirement is **5** points per attended day (changed from 3). It is a base requirement, not a pass mark. |
| 4 | Arrival bands: up to 9:30 = On time; 9:31–9:34; 9:35–9:40; 9:41 or later = After 9:40. |
| 5 | Arrival and notice are judged **by the minute**; seconds are ignored (9:30:59 = On time; 9:34:30 = 9:31–9:34; 9:40:30 = 9:35–9:40). |
| 6 | Points are only earned, never deducted. |
| 7 | Notice points apply **only** to 9:35–9:40 and After-9:40 days. On-time and 9:31–9:34 days cannot earn them. |
| 8 | Informed by 9:30 = 1.5 extra; informed late = 1 extra. |
| 9 | Only notice given on the same day and before arriving counts; notice in the same minute as arrival does not count. |
| 10 | For now, any notice after 9:30 and before arriving counts as late; a cut-off will be added later. |
| 11 | The Admin records the notice time; the app works out the notice outcome. |
| 12 | All leave is approved, and leave is neutral. |
| 13 | Making up for late days through on-time days is accepted (for example, 22 on-time days with 4 very late days is a strong record). |
| 14 | A full week of leave causing a calculation error is an accepted edge case for now. |
| 15 | There are two roles: **Employee** and **Admin**. The Admin handles all marking and decisions, and can change point values. |
| 16 | Entry is manual for now. The app will later derive records from minimal input. |
| 17 | Priority order between principles: **Explainable (gate) → Neutral → Fair → Hard to game → Simple**. |
| 18 | **OT is removed from version 1** and kept strictly for the next scope. |
| 19 | In version 1, a day with overtime is classified by arrival time (e.g. arriving 6:30 AM = On time, 6 points). |

---

## A6. Open Items

| # | Item | Status |
|---|---|---|
| 1 | Handling of attendance-system failures | Open (the owner will decide later) |
| 2 | Handling of missing or blank days | Open |
| 3 | A week where an employee is on leave every working day | Accepted edge case; final handling open |
| 4 | Incentive thresholds and amounts | Open (examples given: Rs 2,000 and Rs 500) |
| 5 | Monthly score: one pooled ratio or an average of weekly ratios | Open |
| 6 | Which minimal inputs the app will use to derive daily records | Open |
| 7 | Cut-off time for "informed late" | Deferred (to be added later) |
| 8 | When a change to point values takes effect | Open (owner will decide later) |

---

## A7. Out of Scope for Version 1

| Item | Status |
|---|---|
| OT (overtime) as a day category | Next scope (decisions kept in B4) |
| Working on a holiday or weekly off | Out of scope |
| Half-day leave | Out of scope |
| How employees inform, and proof of notice | Out of scope |
| Employee informs but does not come | Out of scope |

---

## A8. Glossary

| Term | Meaning |
|---|---|
| Reporting time | 9:30 AM |
| On time | Arrival minute 9:30 or earlier |
| 9:31–9:34 | First late band (4.5 points) |
| 9:35–9:40 | Second late band (2 points); can earn notice points |
| After 9:40 | Last band, arrival minute 9:41 or later (0 points); can earn notice points |
| Approved leave | Leave day; all leave is approved; removed from the base requirement |
| Holiday / weekly off | Non-working day; removed from working days |
| Working days | Calendar days − holidays − weekly offs |
| Attended days | Working days − approved leave days |
| Base requirement | Attended days × 5 |
| Notice time | The minute the employee informed the Admin (same day, before arriving) |
| Notice points | 1.5 extra (informed by 9:30) or 1 extra (informed late), only on 9:35–9:40 and After-9:40 days |
| Total points | Sum of all day points plus notice points for the month |
| Monthly score | Total points ÷ base requirement, shown as a percentage |
| OT | Overtime; **not part of version 1** (see B4) |
| Admin | The role that handles all marking and decisions |
| Employee | The person being scored |