# QA report: Checkpoints 1-3

Full audit done before starting Checkpoint 4. Everything listed under "Bugs found and fixed" was reproduced first (or measured), fixed, and re-verified.

## What was checked

| Area | How | Result |
|---|---|---|
| Rules engine | 89 table-driven tests from B1, B2, B3, B5, C1 | Pass |
| Month calculation | Hand-worked cases, plus September checked against an independent SQL calculation | Match exactly (112.8%, 97.2%, 104.0%, 97.5%) |
| Screens | 248 automated tests across 14 files: Today, Informed, Employees, Month, Results, Needs fixing, Breakdown, Sign-in, Reset password, Access gate | Pass |
| Time zones | Whole suite under India, Los Angeles, Auckland, UTC | Pass in all four |
| Accessibility | axe-core on every screen and sheet (names, labels, roles, structure) | 0 violations |
| Text contrast | Measured in the real browser on every screen at 390px and 320px (WCAG AA, 4.5:1; 3:1 for large text) | 0 failures (the checker was first proven to detect a failure) |
| Layout | Horizontal overflow on every screen at 390px and 320px; welcome tour at 320x568, 320x640, 360x640, 375x667, 390x844; very long names (51 characters, and one with no spaces) | No overflow after fixes |
| Database rules | 22 checks as an Admin and as a removed Admin; 12 checks for close / reopen; re-run after the access-rule change | Pass |
| Signed-out access | Every table and function called with only the public key | 401 on everything |
| Real saves | Against the sample data with the owner's account: Now (compared with the database's own clock), Informed, edit, clear, undo, employees, weekly-off changes, holidays, close, reopen, re-close, history | Pass |
| Production build | `next build` and `next start`: no console errors, main screen loads in 134 ms, 8 parallel database calls of 69-97 ms | Pass |
| Dependencies | `npm audit --omit=dev` | 0 vulnerabilities |
| Database advisors | Security and performance | See "Open notes" |

## Bugs found and fixed in this audit

| # | Bug | Effect | Fix |
|---|---|---|---|
| 1 | **Now** used the time the screen last drew (up to 20 s old) | At the 9:30 / 9:31 boundary an arrival could be saved as 9:30 (6 points) instead of 9:31 (4.5) | Every Now button (row, Informed, both sheets, needs-fixing list, breakdown) reads the clock at the moment of the tap. 3 tests reproduce it |
| 2 | Results kept old numbers for up to 15 s after a save on Today | Wrong score if you looked straight after recording | A Today save also refreshes the month and history; verified in the real app |
| 3 | Someone removed from the approved list still saw the app, empty | Confusing, and they could try actions that then failed | Access gate with a clear message and Sign out |
| 4 | No way back in after a forgotten password | Locked-out Admin | "Forgot password?", a reset link, and a new-password page |
| 5 | Raw errors on screen ("JWT expired", "Failed to fetch") | Unreadable messages | Plain-language messages; the database's own messages pass through |
| 6 | Very long unbroken name pushed the breakdown page and the sheet titles off screen | Sideways scrolling | Headings break anywhere; sheet titles may shrink |
| 7 | Welcome tour cut off the Next button on short phones (320x640) | Could not continue on some Android phones | Tour adapts to short screens and scrolls as a last resort |
| 8 | A future month listed everyone with "No score" | Misleading | "Not started yet" |
| 9 | "Informed but never arrived" was reported as "Nothing recorded" | Hid useful information | States the informed time and that no arrival or leave was recorded |
| 10 | Calendar dates read to screen readers as "2026-11-01" | Hard to use with a screen reader | "Sunday 1 November 2026" |
| 11 | Low-contrast grey text (50-55% ink) | Below AA | Raised to 60% |
| 12 | Small tap target on the "Edited" link; two screens showed the same "nobody counted" text twice; the category tiles cramped at 320px; "So far" badge wrapped | Polish | Fixed |
| 13 | Four database foreign keys without indexes; access check evaluated per row | Performance advisor notes | Indexes added; check evaluated once per query |
| 14 | No page for crashes or unknown addresses | Default framework pages | Friendly error and not-found pages |

Also added: a hint (never a block) when a new employee has the same name as another, and a notice on Today if the server clock cannot be reached.

## Open notes (not bugs; decisions for the owner)

- **Leaked-password protection** is off in Supabase Auth settings. It checks new passwords against known leaks. It is a dashboard setting (Authentication, Providers, Email) and may need a paid plan; the app cannot change it.
- **Reset and confirmation links** only work for addresses allowed in Supabase Auth, URL Configuration. Before going live, set the Site URL and add the live address (done at deployment, Checkpoint 4).
- **Email delivery** on the built-in sender is limited (about 2 a hour) and unreliable for new projects. Fine for one Admin; set a custom email sender before adding several.
- **`npm audit`** reports a dev-only warning in the linter's own tooling (`eslint-config-next`). It never ships; the only "fix" is a downgrade.
- **Not exercised for real:** Sign out (it would end the owner's session) and the actual password-reset email. Both are covered by automated tests of the code around them.
