"use client";

import { useEffect } from "react";

/** Shown if a screen crashes unexpectedly, instead of a blank page. */
export default function Error({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-5 py-10">
      <div className="font-display text-[26px] leading-none font-light tracking-[-0.03em]">OnTime</div>
      <h1 className="mt-10 font-display text-[44px] leading-[0.95] font-light tracking-[-0.04em]">
        Something went <em className="underline decoration-chartreuse decoration-[6px] underline-offset-4">wrong</em>
      </h1>
      <p className="mt-4 text-[17px] leading-snug text-ink/80">Nothing you entered has been lost. Try again, and if it keeps happening, reload the page.</p>
      <button type="button" onClick={() => retry()} className="mt-8 h-14 w-full rounded-[10px] bg-terracotta text-lg font-medium text-ink active:scale-[0.99]">
        Try again
      </button>
    </main>
  );
}
