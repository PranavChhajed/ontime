"use client";

import { animate, AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

/** Every visual draws itself on mount; with reduced motion it shows its end state. */
interface V {
  reduce: boolean;
}

/* ───────────────────────── 1. Clock: 9:30 is the line ───────────────────────── */

// Rounded so server and browser print identical numbers (no hydration mismatch).
const r2 = (n: number) => Math.round(n * 100) / 100 || 0;
function polar(deg: number, r: number) {
  const a = ((deg - 90) * Math.PI) / 180;
  return { x: r2(Math.cos(a) * r), y: r2(Math.sin(a) * r) };
}

export function ClockVisual({ reduce }: V) {
  const [t, setT] = useState(reduce ? 1 : 0);
  useEffect(() => {
    if (reduce) return;
    const c = animate(0, 1, { duration: 1.9, delay: 0.25, ease: [0.3, 0.7, 0.2, 1], onUpdate: setT });
    return () => c.stop();
  }, [reduce]);

  const minuteDeg = 180 * t; // 9:30 -> minute hand at 6
  const hourDeg = 285 * t; // 9:30 -> 9.5 hours x 30
  const m = polar(minuteDeg, 86);
  const h = polar(hourDeg, 56);
  const arcEnd = polar(minuteDeg, 100);

  return (
    <div className="relative grid place-items-center" aria-hidden>
      <svg viewBox="-130 -130 260 260" className="size-[260px]">
        <circle r="122" fill="#fefffa" />
        <circle r="122" fill="none" stroke="#0e0f0a" strokeOpacity="0.12" />
        {Array.from({ length: 60 }, (_, i) => {
          const major = i % 5 === 0;
          const a = polar(i * 6, 112);
          const b = polar(i * 6, major ? 98 : 106);
          return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#0e0f0a" strokeOpacity={major ? 0.7 : 0.25} strokeWidth={major ? 2 : 1} strokeLinecap="round" />;
        })}
        {/* the minutes that pass before the deadline */}
        <path
          d={`M 0 -100 A 100 100 0 ${minuteDeg > 180 ? 1 : 0} 1 ${arcEnd.x} ${arcEnd.y}`}
          fill="none"
          stroke="#e1f079"
          strokeWidth="9"
          strokeLinecap="round"
          opacity={minuteDeg < 1 ? 0 : 1}
        />
        <line x1="0" y1="0" x2={h.x} y2={h.y} stroke="#0e0f0a" strokeWidth="7" strokeLinecap="round" />
        <line x1="0" y1="0" x2={m.x} y2={m.y} stroke="#0e0f0a" strokeWidth="4.5" strokeLinecap="round" />
        <circle r="7" fill="#3d4128" />
      </svg>
      <motion.div
        className="absolute -bottom-3 rounded-full bg-chartreuse px-5 py-2 font-display text-[30px] leading-none font-light tracking-[-0.02em] text-ink"
        initial={reduce ? false : { scale: 0.6, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ delay: reduce ? 0 : 2.05, type: "spring", damping: 12, stiffness: 220 }}
      >
        9:30
      </motion.div>
    </div>
  );
}

/* ───────────────────────── 2. One tap logs an arrival ───────────────────────── */

const NAMES = ["Raja", "Meena", "Anil"];

export function TapVisual({ reduce }: V) {
  // 0 waiting · 1 finger lands · 2 recorded
  const [phase, setPhase] = useState(reduce ? 2 : 0);
  useEffect(() => {
    if (reduce) return;
    let alive = true;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const cycle = () => {
      if (!alive) return;
      setPhase(0);
      timers.push(setTimeout(() => alive && setPhase(1), 1100));
      timers.push(setTimeout(() => alive && setPhase(2), 1550));
      timers.push(setTimeout(cycle, 4300));
    };
    cycle();
    return () => {
      alive = false;
      timers.forEach(clearTimeout);
    };
  }, [reduce]);

  const done = phase === 2;
  return (
    <div className="w-full max-w-[300px] rounded-[24px] bg-linen p-4 text-ink ring-1 ring-ink/10" aria-hidden>
      <div className="flex items-baseline justify-between text-[13px]">
        <span className="font-medium">{done ? 3 : 2} of 3 recorded</span>
        <span className="text-ink/60">Today</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-sand">
        <motion.div className="h-full rounded-full bg-olive" initial={false} animate={{ width: done ? "100%" : "66%" }} transition={{ type: "spring", damping: 24, stiffness: 200 }} />
      </div>

      <div className="mt-3 space-y-2">
        {NAMES.map((n, i) => {
          const isTarget = i === 2;
          return (
            <div key={n} className="relative flex h-14 items-center justify-between rounded-[14px] bg-cream px-3.5 ring-1 ring-ink/10">
              <div>
                <div className="text-[15px] font-medium">{n}</div>
                <div className="text-[11px] text-ink/60">
                  {isTarget ? (done ? "Arrived 9:12" : "Not recorded") : i === 0 ? "Arrived 9:05" : "Arrived 9:27"}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isTarget ? (
                  <AnimatePresence mode="wait" initial={false}>
                    {done ? (
                      <motion.div key="done" initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", damping: 11, stiffness: 260 }} className="flex items-center gap-2">
                        <span className="rounded-full bg-olive px-2.5 py-1 text-[12px] font-medium text-cream">On time</span>
                        <span className="font-display text-[24px] leading-none font-light">6</span>
                      </motion.div>
                    ) : (
                      <motion.div key="btn" exit={{ scale: 0.6, opacity: 0 }} animate={{ scale: phase === 1 ? 0.9 : 1 }} transition={{ duration: 0.12 }} className="grid h-10 w-[72px] place-items-center rounded-[10px] bg-terracotta text-[15px] font-medium text-ink">
                        Now
                      </motion.div>
                    )}
                  </AnimatePresence>
                ) : (
                  <>
                    <span className="rounded-full bg-olive px-2.5 py-1 text-[12px] font-medium text-cream">On time</span>
                    <span className="font-display text-[24px] leading-none font-light">6</span>
                  </>
                )}
              </div>

              {isTarget && !reduce && (
                <motion.span
                  className="pointer-events-none absolute right-6 size-9 rounded-full border-2 border-ink/70 bg-chartreuse/70"
                  initial={false}
                  animate={phase === 1 ? { scale: 1, opacity: 1, y: 0 } : phase === 0 ? { scale: 1.6, opacity: 0, y: 14 } : { scale: 0.6, opacity: 0, y: 0 }}
                  transition={{ duration: 0.25 }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ───────────────────────── 3. Points, fairly ───────────────────────── */

const LADDER = [
  { label: "On time", pts: 6, bar: "bg-olive" },
  { label: "9:31–9:34", pts: 4.5, bar: "bg-ink/35" },
  { label: "9:35–9:40", pts: 2, bar: "bg-clay" },
  { label: "After 9:40", pts: 0, bar: "bg-brick" },
];

export function LadderVisual({ reduce }: V) {
  return (
    <div className="relative w-full max-w-[300px] rounded-[24px] bg-linen p-4 pb-5 text-ink ring-1 ring-ink/10" aria-hidden>
      <div className="space-y-3">
        {LADDER.map((r, i) => (
          <div key={r.label}>
            <div className="flex items-baseline justify-between text-[13px]">
              <span className="font-medium">{r.label}</span>
              <span className="font-display text-[22px] leading-none font-light tabular-nums">{r.pts}</span>
            </div>
            <div className="mt-1 h-3.5 rounded-full bg-sand/70">
              <motion.div
                className={`h-full rounded-full ${r.bar}`}
                initial={reduce ? false : { width: 0 }}
                animate={{ width: `${Math.max((r.pts / 6) * 100, 3)}%` }}
                transition={{ delay: reduce ? 0 : 0.35 + i * 0.22, duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
              />
            </div>
          </div>
        ))}
      </div>
      <motion.div
        className="absolute -right-2 -bottom-3 rotate-[-4deg] rounded-full bg-chartreuse px-3.5 py-2 text-[13px] font-medium text-ink shadow-[0_1px_2px_rgba(14,15,10,0.04)]"
        initial={reduce ? false : { scale: 0.4, opacity: 0, rotate: -14 }}
        animate={{ scale: 1, opacity: 1, rotate: -4 }}
        transition={{ delay: reduce ? 0 : 1.75, type: "spring", damping: 10, stiffness: 240 }}
      >
        +1.5 if they called ahead
      </motion.div>
    </div>
  );
}

/* ───────────────────────── 4. One number a month ───────────────────────── */

export function ScoreVisual({ reduce }: V) {
  const TARGET = 118.8;
  const [n, setN] = useState(reduce ? TARGET : 0);
  useEffect(() => {
    if (reduce) return;
    const c = animate(0, TARGET, { duration: 1.9, delay: 0.3, ease: [0.2, 0.8, 0.2, 1], onUpdate: setN });
    return () => c.stop();
  }, [reduce]);

  const R = 70;
  const C = 2 * Math.PI * R;
  const frac = Math.min(n / 120, 1);
  return (
    <div className="grid w-full max-w-[300px] place-items-center rounded-[24px] bg-linen px-4 py-6 text-ink ring-1 ring-ink/10" aria-hidden>
      <div className="relative size-[190px]">
        <svg viewBox="-90 -90 180 180" className="size-full -rotate-90">
          <circle r={R} fill="none" stroke="#e5e1d6" strokeWidth="12" />
          <circle r={R} fill="none" stroke="#e1f079" strokeWidth="12" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - frac)} />
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <div className="font-display text-[44px] leading-none font-light tracking-[-0.03em] tabular-nums">
            {n.toFixed(1)}
            <span className="text-[24px]">%</span>
          </div>
        </div>
      </div>
      <div className="mt-3 text-center">
        <div className="text-[15px] font-medium">Raja · this month</div>
        <div className="mt-0.5 text-[12px] text-ink/60">Tap a score to see every day behind it</div>
      </div>
    </div>
  );
}
