import { fromCenti, percentTenths, toCenti } from "./points";
import type { DayKind, DayResult, PointValues } from "./types";

export interface MonthResult {
  counts: Record<DayKind, number>;
  noticePoints: number;
  totalPoints: number;
  /** Days that are not holiday / weekly off / not employed. */
  workingDays: number;
  leaveDays: number;
  /** Working days with nothing recorded: out of points and base, block closing. */
  needsAttentionDays: number;
  /** Classified arrival days: working - leave - needs attention. */
  attendedDays: number;
  baseRequirement: number;
  /** Whole tenths of a percent (1188 = 118.8%); null = "No score". */
  scoreTenths: number | null;
}

const KINDS: DayKind[] = [
  "on_time",
  "band_931_934",
  "band_935_940",
  "after_940",
  "leave",
  "holiday",
  "weekly_off",
  "not_employed",
  "needs_attention",
];

/**
 * C1.2.1: one pooled ratio, total points / (attended days x base).
 * Leave and needs-attention days add nothing to the base.
 */
export function scoreMonth(days: DayResult[], v: PointValues): MonthResult {
  const counts = Object.fromEntries(KINDS.map((k) => [k, 0])) as Record<DayKind, number>;
  let totalCenti = 0;
  let noticeCenti = 0;
  for (const d of days) {
    counts[d.kind] += 1;
    totalCenti += toCenti(d.dayPoints);
    noticeCenti += toCenti(d.noticePoints);
  }
  const leaveDays = counts.leave;
  const needsAttentionDays = counts.needs_attention;
  const workingDays = days.length - counts.holiday - counts.weekly_off - counts.not_employed;
  const attendedDays = workingDays - leaveDays - needsAttentionDays;
  const baseCenti = attendedDays * toCenti(v.base);
  return {
    counts,
    noticePoints: fromCenti(noticeCenti),
    totalPoints: fromCenti(totalCenti),
    workingDays,
    leaveDays,
    needsAttentionDays,
    attendedDays,
    baseRequirement: fromCenti(baseCenti),
    scoreTenths: percentTenths(totalCenti, baseCenti),
  };
}
