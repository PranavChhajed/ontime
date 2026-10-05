import type { ArrivalBand } from "./classify";
import { assertMinute, REPORTING } from "./time";
import type { Minute, NoticeOutcome } from "./types";

export function isNoticeEligible(band: ArrivalBand): boolean {
  return band === "band_935_940" || band === "after_940";
}

/**
 * B3.9, applied after the band is known.
 * - band not eligible          -> "not_eligible" (time kept on record, earns 0)
 * - no notice time             -> "not_informed"
 * - notice minute >= arrival   -> "not_informed" (not before arriving)
 * - notice minute <= 9:30      -> "by_930", otherwise "late"
 */
export function noticeOutcome(
  band: ArrivalBand,
  arrival: Minute,
  notice: Minute | null,
): NoticeOutcome {
  if (!isNoticeEligible(band)) return "not_eligible";
  if (notice === null) return "not_informed";
  assertMinute(notice, "notice");
  if (notice >= arrival) return "not_informed";
  return notice <= REPORTING ? "by_930" : "late";
}
