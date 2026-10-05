import type { DateKey } from "@/lib/dates";
import type { Minute } from "@/scoring";

const FACTORY_TZ = "Asia/Kolkata";

const fmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: FACTORY_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** The date and minute at the factory (India) for a moment in time. */
export function factoryNow(ms: number): { date: DateKey; minute: Minute } {
  const p = Object.fromEntries(fmt.formatToParts(new Date(ms)).map((x) => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, minute: Number(p.hour) * 60 + Number(p.minute) };
}
