import type { DayKind } from "@/scoring";

/**
 * How each outcome looks. All warm tones from the style reference; chartreuse
 * is never used here (decorative only). The terracotta fill stays reserved for
 * the one primary action, so late bands use clay and brick instead.
 */
export const KIND_STYLE: Record<DayKind, { label: string; chip: string }> = {
  on_time: { label: "On time", chip: "bg-olive text-cream" },
  band_931_934: { label: "9:31–9:34", chip: "bg-sand text-ink" },
  band_935_940: { label: "9:35–9:40", chip: "bg-clay text-ink" },
  after_940: { label: "After 9:40", chip: "bg-brick text-cream" },
  leave: { label: "Leave", chip: "border border-dashed border-ink/40 text-ink" },
  holiday: { label: "Holiday", chip: "bg-sand/70 text-ink/60" },
  weekly_off: { label: "Weekly off", chip: "bg-sand/70 text-ink/60" },
  not_employed: { label: "Not counted", chip: "bg-sand/70 text-ink/60" },
  needs_attention: { label: "Not recorded", chip: "border border-coral text-brick" },
};
