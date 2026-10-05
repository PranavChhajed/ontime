"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";

/** A short-lived message (usually an error from the database) at the bottom of the screen. */
export function useFlash() {
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const flash = useCallback((m: string) => {
    setMessage(m);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMessage(null), 7000);
  }, []);
  useEffect(() => () => clearTimeout(timer.current), []);
  return { message, flash, clear: () => setMessage(null) };
}

export function FlashToast({ message, onClose }: { message: string | null; onClose: () => void }) {
  return (
    <div className="pointer-events-none fixed inset-x-3 bottom-[calc(5.75rem+env(safe-area-inset-bottom))] z-[60] mx-auto max-w-xl">
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            role="alert"
            className="pointer-events-auto flex items-start gap-3 rounded-[16px] bg-brick px-4 py-3 text-cream"
          >
            <p className="min-w-0 flex-1 text-[14px] leading-snug">{message}</p>
            <button type="button" onClick={onClose} className="shrink-0 px-2 text-[15px] font-medium underline underline-offset-4">
              OK
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
