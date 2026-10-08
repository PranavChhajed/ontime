import type { ChangeRow } from "@/data/rows";
import { formatClock } from "@/scoring";

const FIELD: Record<string, string> = {
  arrival_minute: "Arrival",
  notice_minute: "Informed at",
  leave: "Leave",
};

const when = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Kolkata",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

function value(field: string, v: string | null): string {
  if (v === null) return "none";
  if (field === "arrival_minute" || field === "notice_minute") return formatClock(Number(v));
  if (field === "leave") return v === "true" ? "yes" : "no";
  return v;
}

/** One line of a day's history, in words an Admin can read out. */
export function describeChange(c: ChangeRow): string {
  const time = when.format(new Date(c.at));
  const who = c.by_email ?? "someone";
  if (c.field === "(record)") return `${time} · ${who}: record ${c.new_value === "added" ? "added" : "removed"}`;
  const label = FIELD[c.field] ?? c.field;
  return `${time} · ${who}: ${label} ${c.old_value === null ? "set to" : `${value(c.field, c.old_value)} →`} ${value(c.field, c.new_value)}`;
}

/** A day counts as edited once anything changed after it was first recorded. */
export function wasEdited(changes: ChangeRow[]): boolean {
  return changes.some((c) => c.old_value !== null || (c.field === "(record)" && c.new_value !== "added"));
}

/** Fields that only identify the record (older entries logged them); they say nothing about what changed. */
const IDENTIFIERS = new Set(["day", "employee_id", "id"]);

/** A first-time "leave = false" is the default, not a decision. */
const isNoise = (c: ChangeRow) =>
  IDENTIFIERS.has(c.field) || (c.field === "leave" && c.old_value === null && c.new_value === "false");

export function groupByDay(changes: ChangeRow[]): Record<string, ChangeRow[]> {
  const out: Record<string, ChangeRow[]> = {};
  for (const c of changes) if (c.day && !isNoise(c)) (out[c.day] ??= []).push(c);
  return out;
}

/* ───────────── the whole change history (More → History) ───────────── */

export const POINT_LABEL: Record<string, string> = {
  base: "Base per attended day",
  on_time: "On time (9:30 or earlier)",
  band_931_934: "Arrived 9:31–9:34",
  band_935_940: "Arrived 9:35–9:40",
  after_940: "Arrived after 9:40",
  leave: "Approved leave",
  notice_by_930: "Informed by 9:30",
  notice_late: "Informed after 9:30",
};

const WEEKDAY = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const EMPLOYEE_FIELD: Record<string, string> = { counted_from: "counted from", last_working_date: "last working day", enrollment_no: "enrollment number" };

/** "5 Oct 2026" for a stored yyyy-mm-dd value; anything else is returned as is. */
function shortDate(v: string | null): string {
  if (!v) return "none";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  return new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", day: "numeric", month: "short", year: "numeric" }).format(new Date(`${v}T00:00:00Z`));
}

const pair = (label: string, o: string | null, n: string | null, fmt: (v: string | null) => string) =>
  o === null ? `${label} set to ${fmt(n)}` : n === null ? `${label} cleared (was ${fmt(o)})` : `${label}: ${fmt(o)} → ${fmt(n)}`;

export type EntryGroup = "Records" | "Employees" | "Calendar" | "Points" | "Access" | "Months";

export interface Entry {
  id: number;
  when: string;
  who: string;
  /** Who or what the change is about: a person, a date, "Point values"... */
  subject: string;
  /** What happened, as a sentence fragment. */
  text: string;
  group: EntryGroup;
}

/** Rows that only repeat another row (a new employee also logs "counted from") or log bookkeeping. */
export function isEntryNoise(c: ChangeRow): boolean {
  if (IDENTIFIERS.has(c.field)) return true;
  if (c.entity === "months") return c.field !== "status";
  if (c.entity === "employees") return c.field === "counted_from" && (c.old_value === null || c.new_value === null);
  if (c.entity === "employee_weekly_offs") return c.field === "from_date" && (c.old_value === null || c.new_value === null);
  if (c.entity === "day_records") return isNoise(c);
  return false;
}

const num = (v: string | null) => (v === null ? "none" : String(Number(v)));

/** One history line in plain words. `nameOf` turns an employee id into a name. */
export function describeEntry(c: ChangeRow, nameOf: (id: string | null) => string): Entry {
  const base = { id: c.id, when: when.format(new Date(c.at)), who: c.by_email ?? "someone" };
  const person = nameOf(c.employee_id);
  const added = c.new_value === "added" || (c.old_value === null && c.new_value !== null);
  switch (c.entity) {
    case "day_records": {
      const subject = `${person} · ${shortDate(c.day)}`;
      if (c.field === "(record)") return { ...base, group: "Records", subject, text: added ? "record added" : "record removed" };
      const label = FIELD[c.field] ?? c.field;
      return { ...base, group: "Records", subject, text: c.old_value === null ? `${label} set to ${value(c.field, c.new_value)}` : `${label}: ${value(c.field, c.old_value)} → ${value(c.field, c.new_value)}` };
    }
    case "employees": {
      if (c.field === "name") {
        if (c.old_value === null) return { ...base, group: "Employees", subject: c.new_value ?? person, text: "added" };
        if (c.new_value === null) return { ...base, group: "Employees", subject: c.old_value, text: "removed" };
        return { ...base, group: "Employees", subject: c.old_value, text: `renamed to ${c.new_value}` };
      }
      if (c.field === "photo_path") return { ...base, group: "Employees", subject: person, text: c.old_value === null ? "photo added" : c.new_value === null ? "photo removed" : "photo changed" };
      return { ...base, group: "Employees", subject: person, text: pair(EMPLOYEE_FIELD[c.field] ?? c.field, c.old_value, c.new_value, shortDate) };
    }
    case "employee_weekly_offs": {
      const day = (v: string | null) => (v === null ? "none" : (WEEKDAY[Number(v)] ?? v));
      if (c.field === "weekday") return { ...base, group: "Employees", subject: person, text: c.old_value === null ? `weekly off ${day(c.new_value)} added` : c.new_value === null ? `weekly off ${day(c.old_value)} removed` : `weekly off: ${day(c.old_value)} → ${day(c.new_value)}` };
      if (c.field === "to_date") return { ...base, group: "Employees", subject: person, text: pair("weekly off ends", c.old_value, c.new_value, shortDate) };
      return { ...base, group: "Employees", subject: person, text: pair(c.field, c.old_value, c.new_value, shortDate) };
    }
    case "day_overrides": {
      const subject = `${person} · ${shortDate(c.day)}`;
      const kind = (v: string | null) => (v === "off" ? "day off" : v === "working" ? "working day" : (v ?? "none"));
      return { ...base, group: "Calendar", subject, text: c.old_value === null ? `made a ${kind(c.new_value)}` : c.new_value === null ? `back to the usual week (was ${kind(c.old_value)})` : `${kind(c.old_value)} → ${kind(c.new_value)}` };
    }
    case "holidays": {
      const subject = `Holiday · ${shortDate(c.day)}`;
      if (c.field === "name") return { ...base, group: "Calendar", subject, text: c.old_value === null ? `marked as a holiday: ${c.new_value}` : c.new_value === null ? `holiday removed (${c.old_value})` : `renamed ${c.old_value} → ${c.new_value}` };
      return { ...base, group: "Calendar", subject, text: added ? "marked as a holiday" : "holiday removed" };
    }
    case "point_values":
      return { ...base, group: "Points", subject: POINT_LABEL[c.field] ?? c.field, text: `${num(c.old_value)} → ${num(c.new_value)} points` };
    case "months": {
      const month = c.day ? new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", month: "long", year: "numeric" }).format(new Date(`${c.day}T00:00:00Z`)) : "A month";
      return { ...base, group: "Months", subject: month, text: c.new_value === "closed" ? "closed and locked" : "reopened for corrections" };
    }
    case "approved_emails":
      return { ...base, group: "Access", subject: c.entity_key ?? "An email", text: added ? "given access" : "access removed" };
    default:
      return { ...base, group: "Records", subject: person, text: `${c.field}: ${c.old_value ?? "none"} → ${c.new_value ?? "none"}` };
  }
}
