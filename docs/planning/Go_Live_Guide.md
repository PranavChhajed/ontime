# Go-live guide

Steps to put OnTime on a real address, and to run the trial month beside the Excel sheet.
Written for the owner; nothing here needs coding.

## 1. Deployed

- Live address: **https://ontime-rose.vercel.app** (Vercel project `ontime`, region Mumbai).
- Code: https://github.com/PranavChhajed/ontime (private). Redeploy after a change: `npx vercel deploy --prod`.
- Vercel holds `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (both safe in a browser).
- **Owner step (Supabase dashboard, project `ontime`): Authentication → URL Configuration.**
  - Site URL: `https://ontime-rose.vercel.app`
  - Redirect URLs: add `https://ontime-rose.vercel.app/**`
  Without this, confirmation and password-reset emails point to the wrong place.
- Open the address on a phone, sign in, and add it to the home screen.

## 2. Settings only you can change (Supabase dashboard)

| Setting | Where | Why |
|---|---|---|
| Leaked-password protection | Authentication → Providers → Email | Refuses passwords found in known leaks (may need a paid plan) |
| Custom email sender (SMTP) | Authentication → Emails → SMTP | The built-in sender allows about 2 emails an hour. Needed once several Admins are added |

## 3. Before real use

1. Open **More → Admin access** and add each Admin's email. They choose "Create account" with that email.
2. Remove the two `Sample ...` employees only when you say so: `supabase/seed/remove_sample_data.sql`.
3. Add the real employees (**More → Employees**), weekly offs, and the month's holidays (**Month**).
4. Check **More → Point values** matches your current Excel column A.

## 4. Trial month beside Excel

Run one full month in both. At month end, compare per person.

Expected differences, and why (decision C1.2.1):

| Cause | Effect |
|---|---|
| OnTime pools all days into one ratio; Excel averages weekly ratios | A person with an uneven week (for example 2 attended days in one week) scores slightly differently |
| Excel counts a blank working day as very late; OnTime marks it "Needs attention" and refuses to close the month | The gap is fixed instead of silently lowering the score |
| Excel can give notice points to arrivals that cannot earn them | OnTime does not |
| The docs' example "arrived 9:47, informed 9:22 = 3.5" is wrong | It is 1.5 |

Any difference not explained by this table is a bug. Write down the person, date and both figures and send it to me.

When the figures match for the explained reasons, you decide the day Excel stops.
