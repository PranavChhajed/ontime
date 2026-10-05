"use client";

import { AnimatePresence, motion, useReducedMotion, type PanInfo } from "motion/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type ComponentType } from "react";
import { ClockVisual, LadderVisual, ScoreVisual, TapVisual } from "./visuals";

const ONBOARDED_KEY = "ontime.onboarded";

type Tok = string | { e: string };

interface Slide {
  id: string;
  headline: Tok[];
  body: string;
  Visual: ComponentType<{ reduce: boolean }>;
}

const SLIDES: Slide[] = [
  {
    id: "clock",
    headline: ["Punctuality,", { e: "simply" }, "counted."],
    body: "OnTime turns each day’s arrival time into one fair score for every employee, every month.",
    Visual: ClockVisual,
  },
  {
    id: "tap",
    headline: ["Log an arrival", "in", { e: "one" }, "tap."],
    body: "When someone walks in, tap Now. If they called ahead, add the time they informed you.",
    Visual: TapVisual,
  },
  {
    id: "points",
    headline: ["The app does", "the", { e: "maths" }],
    body: "On time earns the most. Later arrivals earn less, and calling ahead earns a little back. Leave and holidays never hurt anyone.",
    Visual: LadderVisual,
  },
  {
    id: "score",
    headline: ["One number", "a", { e: "month" }],
    body: "Close the month to see each person’s percentage. Every score can be explained, day by day.",
    Visual: ScoreVisual,
  },
];

function finish(router: ReturnType<typeof useRouter>) {
  try {
    localStorage.setItem(ONBOARDED_KEY, "1");
  } catch {
    /* storage blocked: the tour simply shows again next time */
  }
  router.push("/");
}

export function Onboarding() {
  const router = useRouter();
  const reduce = useReducedMotion() ?? false;
  const [[index, dir], setPage] = useState<[number, number]>([0, 1]);
  const last = index === SLIDES.length - 1;
  const slide = SLIDES[index];

  const go = useCallback(
    (to: number) => {
      if (to < 0) return;
      if (to >= SLIDES.length) return finish(router);
      setPage(([from]) => [to, to > from ? 1 : -1]);
    },
    [router],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(index + 1);
      if (e.key === "ArrowLeft") go(index - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, index]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -60 || info.velocity.x < -450) go(index + 1);
    else if (info.offset.x > 60 || info.velocity.x > 450) go(index - 1);
  };

  const { Visual } = slide;

  return (
    <div className="relative flex min-h-dvh flex-col overflow-x-clip bg-olive text-cream">
      {/* slow drifting light: transform-only, cheap on a mid-range phone */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-clip">
        <div className="animate-drift absolute -top-1/4 -left-1/3 size-[90vmax] rounded-full bg-[radial-gradient(closest-side,rgba(225,240,121,0.16),transparent)]" />
        <div className="animate-drift-slow absolute -right-1/3 -bottom-1/3 size-[80vmax] rounded-full bg-[radial-gradient(closest-side,rgba(222,118,83,0.14),transparent)]" />
      </div>

      <header className="relative z-10 mx-auto flex w-full max-w-xl items-center justify-between px-5 pt-[max(1.25rem,env(safe-area-inset-top))]">
        <span className="font-display text-[26px] leading-none font-light tracking-[-0.03em] text-chartreuse">OnTime</span>
        {!last && (
          <button type="button" onClick={() => finish(router)} className="-mr-2 rounded-full px-4 py-2.5 text-[15px] text-cream/80 active:bg-cream/10">
            Skip
          </button>
        )}
      </header>

      <motion.div
        className="relative z-10 mx-auto flex w-full max-w-xl flex-1 touch-pan-y flex-col px-5"
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.18}
        onDragEnd={onDragEnd}
      >
        <AnimatePresence mode="wait" custom={dir} initial={false}>
          <motion.div
            key={slide.id}
            custom={dir}
            className="flex flex-1 flex-col"
            variants={{
              enter: (d: number) => ({ x: reduce ? 0 : d * 56, opacity: 0 }),
              center: { x: 0, opacity: 1 },
              exit: (d: number) => ({ x: reduce ? 0 : d * -56, opacity: 0 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: reduce ? 0 : 0.26, ease: [0.3, 0.7, 0.3, 1] }}
          >
            <div className="grid flex-1 place-items-center py-4 [@media(max-height:740px)]:py-2 [@media(max-height:740px)]:[zoom:0.82] [@media(max-height:620px)]:[zoom:0.68]">
              <Visual reduce={reduce} />
            </div>
            <Copy slide={slide} reduce={reduce} />
          </motion.div>
        </AnimatePresence>
      </motion.div>

      <footer className="relative z-10 mx-auto w-full max-w-xl px-5 pt-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <div className="mb-5 flex items-center justify-center gap-2" role="tablist" aria-label="Tour progress">
          {SLIDES.map((s, i) => (
            <motion.button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Step ${i + 1} of ${SLIDES.length}`}
              onClick={() => go(i)}
              className="h-2 rounded-full"
              initial={false}
              animate={{ width: i === index ? 30 : 8, backgroundColor: i === index ? "#e1f079" : "rgba(250,245,241,0.32)" }}
              transition={{ type: "spring", damping: 22, stiffness: 300 }}
            />
          ))}
        </div>
        <div className="flex gap-3">
          {index > 0 && (
            <button type="button" onClick={() => go(index - 1)} className="h-14 w-24 rounded-[10px] border border-cream/35 text-base text-cream active:bg-cream/10">
              Back
            </button>
          )}
          <button
            type="button"
            onClick={() => go(index + 1)}
            className="h-14 flex-1 rounded-[10px] bg-chartreuse text-lg font-medium text-ink active:scale-[0.98]"
          >
            {last ? "Start recording" : "Next"}
          </button>
        </div>
      </footer>
    </div>
  );
}

function Copy({ slide, reduce }: { slide: Slide; reduce: boolean }) {
  let w = 0;
  return (
    <div className="pb-2">
      <h1 className="font-display text-[46px] leading-[0.96] font-light tracking-[-0.04em] text-chartreuse [@media(max-height:740px)]:text-[38px]">
        {slide.headline.map((tok, i) => {
          const isEm = typeof tok !== "string";
          const text = isEm ? tok.e : tok;
          const delay = reduce ? 0 : 0.12 + w++ * 0.07;
          return (
            <span key={i}>
              <motion.span
                className={`relative inline-block ${isEm ? "italic" : ""}`}
                initial={reduce ? false : { y: "0.55em", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay, duration: 0.55, ease: [0.2, 0.8, 0.2, 1] }}
              >
                {text}
                {isEm && <Underline delay={reduce ? 0 : delay + 0.4} reduce={reduce} />}
              </motion.span>{" "}
            </span>
          );
        })}
      </h1>
      <motion.p
        className="mt-5 max-w-[34ch] text-[17px] leading-snug text-cream/85 [@media(max-height:740px)]:mt-3 [@media(max-height:740px)]:text-[16px]"
        initial={reduce ? false : { y: 14, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: reduce ? 0 : 0.55, duration: 0.5 }}
      >
        {slide.body}
      </motion.p>
    </div>
  );
}

/** Hand-drawn stroke: slightly uneven, drawn on after the word lands. */
function Underline({ delay, reduce }: { delay: number; reduce: boolean }) {
  return (
    <svg aria-hidden viewBox="0 0 100 14" preserveAspectRatio="none" className="absolute -bottom-[0.1em] left-0 h-[0.26em] w-full overflow-visible">
      <motion.path
        d="M2 8 C 14 3, 26 11, 42 6 S 70 3, 98 7"
        fill="none"
        stroke="#e1f079"
        strokeWidth="6"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        initial={reduce ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay, duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
      />
    </svg>
  );
}
