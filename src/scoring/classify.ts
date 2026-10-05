import { assertMinute, BAND_2_LAST, BAND_3_LAST, REPORTING } from "./time";
import type { Minute } from "./types";

export type ArrivalBand = "on_time" | "band_931_934" | "band_935_940" | "after_940";

/** B1.4: decided only by the arrival minute. No gaps, no overlaps. */
export function classifyArrival(arrival: Minute): ArrivalBand {
  assertMinute(arrival, "arrival");
  if (arrival <= REPORTING) return "on_time";
  if (arrival <= BAND_2_LAST) return "band_931_934";
  if (arrival <= BAND_3_LAST) return "band_935_940";
  return "after_940";
}
