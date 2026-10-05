/** Plain calendar dates as "YYYY-MM-DD" strings. No time zones involved. */
export type DateKey = string;

const pad = (n: number) => String(n).padStart(2, "0");

export function toDateKey(d: Date): DateKey {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function fromDateKey(key: DateKey): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(key: DateKey, n: number): DateKey {
  const d = fromDateKey(key);
  d.setDate(d.getDate() + n);
  return toDateKey(d);
}

/** 0 = Sunday ... 6 = Saturday. */
export function weekday(key: DateKey): number {
  return fromDateKey(key).getDay();
}

export const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

/** "Mon 5 Oct" */
export function formatDayHeading(key: DateKey): string {
  const d = fromDateKey(key);
  return `${WEEKDAY_SHORT[d.getDay()]} ${d.getDate()} ${MONTH_SHORT[d.getMonth()]}`;
}

const WEEKDAY_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;
const MONTH_NAME = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"] as const;

/** "Monday 5 October 2026": what a screen reader should say for a date. */
export function formatDayLong(key: DateKey): string {
  const d = fromDateKey(key);
  return `${WEEKDAY_LONG[d.getDay()]} ${d.getDate()} ${MONTH_NAME[d.getMonth()]} ${d.getFullYear()}`;
}

/** "5 Oct 2026" - same wording on every phone, whatever its language setting. */
export function formatDate(key: DateKey): string {
  const d = fromDateKey(key);
  return `${d.getDate()} ${MONTH_SHORT[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatYear(key: DateKey): string {
  return String(fromDateKey(key).getFullYear());
}

/** First day of the month containing a date: "2026-10-17" -> "2026-10-01". */
export const monthStart = (d: DateKey): DateKey => `${d.slice(0, 7)}-01`;

export function nextMonthStart(d: DateKey): DateKey {
  const [y, m] = d.split("-").map(Number);
  return m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, "0")}-01`;
}

/** Last day of the month containing a date. */
export const monthEnd = (d: DateKey): DateKey => addDays(nextMonthStart(d), -1);

const MONTH_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"] as const;

/** "2026-10-01" -> "October 2026" */
export function formatMonth(monthFirst: DateKey): string {
  const [y, m] = monthFirst.split("-").map(Number);
  return `${MONTH_LONG[m - 1]} ${y}`;
}

/** Add (or subtract) whole months to the first day of a month. */
export function shiftMonth(monthFirst: DateKey, by: number): DateKey {
  const [y, m] = monthFirst.split("-").map(Number);
  const d = new Date(y, m - 1 + by, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

/** The URL piece for a month: "2026-10-01" -> "2026-10". Returns null for anything else. */
export const monthToParam = (monthFirst: DateKey): string => monthFirst.slice(0, 7);
export function monthFromParam(param: string): DateKey | null {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(param) ? `${param}-01` : null;
}
