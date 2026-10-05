import { classifyArrival, type ArrivalBand } from "./classify";
import { noticeOutcome } from "./notice";
import { formatPoints, fromCenti, toCenti } from "./points";
import { assertMinute, formatClock } from "./time";
import type {
  DayConflict,
  DayInput,
  DayKind,
  DayResult,
  NoticeOutcome,
  PointValues,
} from "./types";

const LABEL: Record<ArrivalBand, string> = {
  on_time: "On time",
  band_931_934: "9:31–9:34",
  band_935_940: "9:35–9:40",
  after_940: "After 9:40",
};

function categoryPointsFor(band: ArrivalBand, v: PointValues): number {
  switch (band) {
    case "on_time":
      return v.onTime;
    case "band_931_934":
      return v.band931934;
    case "band_935_940":
      return v.band935940;
    case "after_940":
      return v.after940;
  }
}

function empty(kind: DayKind, explanation: string, conflict: DayConflict = null): DayResult {
  return {
    kind,
    inBase: false,
    categoryPoints: 0,
    noticeOutcome: "none",
    noticePoints: 0,
    dayPoints: 0,
    conflict,
    explanation,
  };
}

const pointsText = (p: number) => `${formatPoints(p)} ${p === 1 ? "point" : "points"}`;

/**
 * One day, scored on its own, in the B1.10 order:
 * not employed / holiday / weekly off -> leave -> nothing recorded -> band.
 */
export function scoreDay(day: DayInput, v: PointValues): DayResult {
  if (day.arrivalMinute !== null) assertMinute(day.arrivalMinute, "arrival");
  if (day.noticeMinute !== null) assertMinute(day.noticeMinute, "notice");
  const hasArrival = day.arrivalMinute !== null;

  if (day.nonWorking) {
    const names = {
      holiday: "Holiday",
      weekly_off: "Weekly off",
      not_employed: "Not employed on this date",
    } as const;
    const conflict: DayConflict = hasArrival ? "arrival_on_non_working" : null;
    const extra = hasArrival ? " (an arrival is recorded but not scored)" : "";
    return empty(day.nonWorking, `${names[day.nonWorking]} → not scored${extra}`, conflict);
  }

  if (day.leave) {
    const conflict: DayConflict = hasArrival ? "leave_and_arrival" : null;
    const extra = hasArrival ? " (an arrival is also recorded; leave is used)" : "";
    const r = empty("leave", `Marked by Admin: Approved leave → not in base${extra}`, conflict);
    const c = fromCenti(toCenti(v.leave));
    return { ...r, categoryPoints: c, dayPoints: c };
  }

  if (day.arrivalMinute === null) {
    const informed =
      day.noticeMinute === null
        ? ""
        : `Informed ${formatClock(day.noticeMinute)}, not arrived yet. `;
    return empty("needs_attention", `${informed}Nothing recorded → needs attention; not scored`);
  }

  const arrival = day.arrivalMinute;
  const band = classifyArrival(arrival);
  const outcome: NoticeOutcome = noticeOutcome(band, arrival, day.noticeMinute);

  const catCenti = toCenti(categoryPointsFor(band, v));
  const noticeCenti =
    outcome === "by_930"
      ? toCenti(v.noticeBy930)
      : outcome === "late"
        ? toCenti(v.noticeLate)
        : 0;
  const total = fromCenti(catCenti + noticeCenti);

  const informedText =
    day.noticeMinute === null ? "" : `, informed ${formatClock(day.noticeMinute)}`;
  const tail =
    outcome === "by_930"
      ? " + informed by 9:30"
      : outcome === "late"
        ? " + informed late"
        : outcome === "not_eligible" && day.noticeMinute !== null
          ? "; notice not eligible"
          : outcome === "not_informed" && day.noticeMinute !== null
            ? "; notice not before arrival"
            : "";

  return {
    kind: band,
    inBase: true,
    categoryPoints: fromCenti(catCenti),
    noticeOutcome: outcome,
    noticePoints: fromCenti(noticeCenti),
    dayPoints: total,
    conflict: null,
    explanation: `Arrived ${formatClock(arrival)}${informedText} → ${LABEL[band]}${tail} = ${pointsText(total)}`,
  };
}
