"use client";

import { useMemo } from "react";
import { useClock, useEmployees, useMonthCalendar, useMonthRecords, useMonthState, usePointValues } from "@/data/queries";
import type { DateKey } from "@/lib/dates";
import { canClose, computeMonth, findProblems, type EmployeeView } from "./compute";

/**
 * Everything about one month, in one place.
 * Open month: worked out live from the day records (provisional, "so far").
 * Closed month: the results frozen when it was closed.
 */
export function useResults(monthFirst: DateKey) {
  const clock = useClock();
  const employeesQ = useEmployees();
  const currentValuesQ = usePointValues();
  const recordsQ = useMonthRecords(monthFirst);
  const calQ = useMonthCalendar(monthFirst);
  const stateQ = useMonthState(monthFirst);
  const { date: today } = clock.now();

  const queries = [employeesQ, currentValuesQ, recordsQ, calQ, stateQ];
  const loading = !clock.ready || queries.some((q) => q.isPending);
  const error = queries.map((q) => q.error).find(Boolean) ?? null;

  const state = stateQ.data ?? null;
  const isClosed = state?.status === "closed";
  // A month that has ever been closed stays on the point values it was first closed with (C1.3 #3).
  const values = state?.savedValues ?? currentValuesQ.data;

  const live: EmployeeView[] = useMemo(() => {
    if (!employeesQ.data || !values || !recordsQ.data || !calQ.data) return [];
    return computeMonth(employeesQ.data, {
      monthFirst,
      asOf: today,
      records: recordsQ.data,
      holidays: calQ.data.holidays,
      overrides: calQ.data.overrides,
      values,
    });
  }, [employeesQ.data, values, recordsQ.data, calQ.data, monthFirst, today]);

  const views = isClosed && state?.savedResults ? state.savedResults.employees : live;
  // Today is still in progress, so only days that are over can need fixing.
  const problems = useMemo(() => (isClosed ? [] : findProblems(live).filter((p) => p.date < today)), [isClosed, live, today]);
  const closeCheck = canClose(monthFirst, today, problems, live.length);

  return {
    loading,
    error,
    refetch: () => queries.forEach((q) => void q.refetch()),
    today,
    getNow: () => clock.now().minute,
    isClosed,
    state,
    views,
    /** Live figures even for a closed month (used when closing again after a reopen). */
    live,
    problems,
    closeCheck,
    values,
    employees: employeesQ.data ?? [],
    records: recordsQ.data ?? {},
    calendar: calQ.data,
  };
}
