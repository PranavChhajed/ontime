"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, type ReactNode } from "react";
import type { Minute } from "@/scoring";

/** Bottom sheet shell: backdrop, slide-up, Escape to close, page scroll locked. */
export function Sheet({
  label,
  onClose,
  children,
}: {
  label: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const reduce = useReducedMotion();
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    panel.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <motion.button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-ink/45"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        className="relative max-h-[94dvh] w-full max-w-xl overflow-y-auto rounded-t-[28px] bg-cream px-5 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] outline-none"
        initial={reduce ? { opacity: 0 } : { y: "100%" }}
        animate={reduce ? { opacity: 1 } : { y: 0 }}
        transition={{ type: "spring", damping: 32, stiffness: 340 }}
      >
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-ink/15" />
        {children}
      </motion.div>
    </div>
  );
}

export const toInput = (m: Minute | null) =>
  m === null ? "" : `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

/** Big time field with a Now button, sized for a thumb. */
export function TimeField({
  id,
  label,
  hint,
  value,
  onChange,
  onNow,
  disabled,
  primaryNow,
}: {
  id: string;
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  onNow: () => void;
  disabled?: boolean;
  /** Terracotta Now button (the main action of this field). */
  primaryNow?: boolean;
}) {
  return (
    <section>
      <label htmlFor={id} className="text-sm font-medium">
        {label} {hint && <span className="font-normal text-ink/60">{hint}</span>}
      </label>
      <div className="mt-1.5 flex gap-2">
        <input
          id={id}
          type="time"
          step={60}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className="h-14 min-w-0 flex-1 rounded-[10px] border border-deep-olive bg-linen px-4 text-[26px] tabular-nums outline-none focus:border-ink focus:ring-2 focus:ring-chartreuse disabled:opacity-40"
        />
        <button
          type="button"
          disabled={disabled}
          onClick={onNow}
          className={`h-14 shrink-0 rounded-[10px] px-5 text-base font-medium active:scale-[0.97] disabled:opacity-40 ${
            primaryNow ? "bg-terracotta text-ink" : "border border-ink"
          }`}
        >
          Now
        </button>
      </div>
    </section>
  );
}
