/** Minutes after midnight, 0-1439. 9:30 = 570. Seconds never exist. */
export type Minute = number;

/** Admin-editable values (B2). Band edges are NOT here: they are rules. */
export interface PointValues {
  base: number;
  onTime: number;
  band931934: number;
  band935940: number;
  after940: number;
  leave: number;
  noticeBy930: number;
  noticeLate: number;
}

export const DEFAULT_POINT_VALUES: PointValues = {
  base: 5,
  onTime: 6,
  band931934: 4.5,
  band935940: 2,
  after940: 0,
  leave: 0,
  noticeBy930: 1.5,
  noticeLate: 1,
};

/** What the calendar says about one employee on one date. */
export type NonWorking = "holiday" | "weekly_off" | "not_employed" | null;

export interface DayInput {
  nonWorking: NonWorking;
  leave: boolean;
  arrivalMinute: Minute | null;
  noticeMinute: Minute | null;
}

export type DayKind =
  | "on_time"
  | "band_931_934"
  | "band_935_940"
  | "after_940"
  | "leave"
  | "holiday"
  | "weekly_off"
  | "not_employed"
  | "needs_attention";

export type NoticeOutcome =
  | "by_930"
  | "late"
  | "not_informed"
  | "not_eligible"
  | "none";

/** Known contradictions (B1.17). The engine never scores through them silently. */
export type DayConflict = "leave_and_arrival" | "arrival_on_non_working" | null;

export interface DayResult {
  kind: DayKind;
  /** Counts toward the base requirement (an attended, classified day). */
  inBase: boolean;
  categoryPoints: number;
  noticeOutcome: NoticeOutcome;
  noticePoints: number;
  dayPoints: number;
  conflict: DayConflict;
  /** Plain sentence the Admin can read out (A2.1). */
  explanation: string;
}
