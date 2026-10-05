"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useClock } from "@/data/queries";
import { monthStart, monthToParam } from "@/lib/dates";

/** /results with no month: go to the current month (by the factory's clock, in India). */
export function CurrentMonthRedirect() {
  const router = useRouter();
  const clock = useClock();
  const { date } = clock.now();
  useEffect(() => {
    if (clock.ready) router.replace(`/results/${monthToParam(monthStart(date))}`);
  }, [clock.ready, date, router]);
  return (
    <div className="mx-auto w-full max-w-xl px-4 pt-6" aria-busy="true">
      <div className="h-10 w-40 animate-pulse rounded-full bg-sand/60" />
    </div>
  );
}
