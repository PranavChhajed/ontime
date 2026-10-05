import type { Minute } from "./types";

export const REPORTING = 9 * 60 + 30; // 9:30
export const BAND_2_LAST = 9 * 60 + 34; // 9:34
export const BAND_3_LAST = 9 * 60 + 40; // 9:40

export function assertMinute(m: number, label: string): void {
  if (!Number.isInteger(m) || m < 0 || m > 1439) {
    throw new RangeError(`${label} must be a whole minute 0-1439, got ${m}`);
  }
}

/** "9:30" or "09:30:59" -> minute. Seconds are dropped, never rounded up (B1.5). */
export function parseClock(text: string): Minute {
  const m = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(text.trim());
  if (!m) throw new RangeError(`Not a time: "${text}"`);
  const h = Number(m[1]);
  const min = Number(m[2]);
  const sec = m[3] === undefined ? 0 : Number(m[3]);
  if (h > 23 || min > 59 || sec > 59) throw new RangeError(`Not a time: "${text}"`);
  return h * 60 + min;
}

/** 570 -> "9:30", 785 -> "13:05". */
export function formatClock(minute: Minute): string {
  assertMinute(minute, "minute");
  const h = Math.floor(minute / 60);
  const m = minute % 60;
  return `${h}:${String(m).padStart(2, "0")}`;
}
