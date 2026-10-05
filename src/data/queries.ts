"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { factoryNow } from "@/lib/clock";
import { friendlyError } from "@/lib/errors";
import { monthEnd, monthStart, type DateKey } from "@/lib/dates";
import type { EmployeeView } from "@/features/results/compute";
import type { PointValues } from "@/scoring";
import type { DayRecord, Employee, HolidayMap, OverrideKind, OverrideMap } from "@/features/today/types";
import type { AdminRow, ChangeRow, DayRecordRow, EmployeeRow, HolidayRow, MonthRow, OverrideRow, PointValuesRow, WeeklyOffRow } from "./rows";

const sb = createClient();

function must<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(friendlyError(res.error.message));
  return res.data as T;
}

/** Throw a database error in words an Admin can act on. */
function fail(error: { message: string }): never {
  throw new Error(friendlyError(error.message));
}

/* ───────────── clock (server time, India) ───────────── */

export function useClock() {
  const q = useQuery({
    queryKey: ["serverTime"],
    staleTime: 5 * 60_000,
    refetchInterval: 5 * 60_000,
    retry: 1,
    queryFn: async () => {
      const t0 = Date.now();
      const res = await sb.rpc("server_time");
      const t1 = Date.now();
      const server = new Date(must(res) as unknown as string).getTime();
      return server - (t0 + t1) / 2; // offset between this phone's clock and the server's
    },
  });
  const offset = q.data ?? 0;
  const now = useCallback(() => factoryNow(Date.now() + offset), [offset]);
  // Re-render every 20s so "today" rolls over at midnight and Now stays current.
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 20_000);
    return () => clearInterval(id);
  }, []);
  return { ready: q.isSuccess || q.isError, now, usingServerTime: q.isSuccess };
}

/* ───────────── employees ───────────── */

export function useEmployees() {
  return useQuery({
    queryKey: ["employees"],
    queryFn: async (): Promise<Employee[]> => {
      const [e, w] = await Promise.all([
        sb.from("employees").select("*").order("name").returns<EmployeeRow[]>(),
        sb.from("employee_weekly_offs").select("*").returns<WeeklyOffRow[]>(),
      ]);
      const emps = must(e);
      const offs = must(w);
      return emps.map((r) => ({
        id: r.id,
        name: r.name,
        countedFrom: r.counted_from,
        lastWorkingDate: r.last_working_date,
        enrollmentNo: r.enrollment_no ?? null,
        weeklyOffs: offs
          .filter((o) => o.employee_id === r.id)
          .map((o) => ({ weekday: o.weekday, from: o.from_date, to: o.to_date })),
      }));
    },
  });
}

export interface EmployeeInput {
  id: string | null;
  name: string;
  countedFrom: DateKey;
  lastWorkingDate: DateKey | null;
  enrollmentNo?: string | null;
  weekdays: number[];
  /** Date the new weekly off takes effect (edits only). */
  weeklyOffFrom: DateKey;
}

export function useSaveEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: EmployeeInput) => {
      const res = await sb.rpc("save_employee", {
        p_id: v.id,
        p_name: v.name,
        p_counted_from: v.countedFrom,
        p_last_working: v.lastWorkingDate,
        p_weekdays: v.weekdays,
        p_from: v.weeklyOffFrom,
        p_enrollment: v.enrollmentNo?.trim() || null,
      } as never);
      return must(res) as unknown as string;
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["employees"] }),
  });
}

export function useDeleteEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await sb.from("employees").delete().eq("id", id);
      if (res.error) fail(res.error);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["employees"] }),
  });
}

/* ───────────── calendar: holidays and one-date overrides, per month ───────────── */

export function useMonthCalendar(anyDateInMonth: DateKey) {
  const from = monthStart(anyDateInMonth);
  const to = monthEnd(anyDateInMonth);
  return useQuery({
    queryKey: ["calendar", from],
    queryFn: async (): Promise<{ holidays: HolidayMap; overrides: OverrideMap }> => {
      const [h, o] = await Promise.all([
        sb.from("holidays").select("*").gte("day", from).lte("day", to).returns<HolidayRow[]>(),
        sb.from("day_overrides").select("*").gte("day", from).lte("day", to).returns<OverrideRow[]>(),
      ]);
      const holidays: HolidayMap = {};
      must(h).forEach((r) => (holidays[r.day] = r.name ?? ""));
      const overrides: OverrideMap = {};
      must(o).forEach((r) => ((overrides[r.employee_id] ??= {})[r.day] = r.kind));
      return { holidays, overrides };
    },
  });
}

type CalendarData = { holidays: HolidayMap; overrides: OverrideMap };

/** Update the cached month straight away; the caller restores `prev` if saving fails. */
async function optimisticCalendar(
  qc: ReturnType<typeof useQueryClient>,
  day: DateKey,
  change: (data: CalendarData) => CalendarData,
) {
  const key = ["calendar", monthStart(day)];
  await qc.cancelQueries({ queryKey: key });
  const prev = qc.getQueryData<CalendarData>(key);
  if (prev) qc.setQueryData<CalendarData>(key, change(prev));
  return { key, prev };
}

export function useToggleHoliday() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: { day: DateKey; name: string | null; remove: boolean }) => {
      const res = v.remove
        ? await sb.from("holidays").delete().eq("day", v.day)
        : await sb.from("holidays").upsert({ day: v.day, name: v.name });
      if (res.error) fail(res.error);
    },
    onMutate: (v) =>
      optimisticCalendar(qc, v.day, (d) => {
        const holidays = { ...d.holidays };
        if (v.remove) delete holidays[v.day];
        else holidays[v.day] = v.name ?? "";
        return { ...d, holidays };
      }),
    onError: (_e, _v, ctx) => ctx?.prev && qc.setQueryData(ctx.key, ctx.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: ["calendar"] }),
  });
}

export function useSetOverride() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: { employeeId: string; day: DateKey; kind: OverrideKind | null }) => {
      const res =
        v.kind === null
          ? await sb.from("day_overrides").delete().eq("employee_id", v.employeeId).eq("day", v.day)
          : await sb.from("day_overrides").upsert({ employee_id: v.employeeId, day: v.day, kind: v.kind });
      if (res.error) fail(res.error);
    },
    onMutate: (v) =>
      optimisticCalendar(qc, v.day, (d) => {
        const mine = { ...(d.overrides[v.employeeId] ?? {}) };
        if (v.kind === null) delete mine[v.day];
        else mine[v.day] = v.kind;
        return { ...d, overrides: { ...d.overrides, [v.employeeId]: mine } };
      }),
    onError: (_e, _v, ctx) => ctx?.prev && qc.setQueryData(ctx.key, ctx.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: ["calendar"] }),
  });
}

/* ───────────── day records ───────────── */

type RecordMap = Record<string, DayRecord>;

export function useDayRecords(day: DateKey) {
  return useQuery({
    queryKey: ["records", day],
    // Another Admin may be recording on their own phone: pick their changes up on their own.
    refetchInterval: 30_000,
    queryFn: async (): Promise<RecordMap> => {
      const rows = must(await sb.from("day_records").select("*").eq("day", day).returns<DayRecordRow[]>());
      const map: RecordMap = {};
      rows.forEach((r) => (map[r.employee_id] = { arrival: r.arrival_minute, notice: r.notice_minute, leave: r.leave }));
      return map;
    },
  });
}

/** Save (or clear, with null) one employee's record. Updates the screen at once and rolls back on error. */
export function useSaveRecord(day: DateKey) {
  const qc = useQueryClient();
  const key = ["records", day];
  return useMutation({
    mutationFn: async (v: { employeeId: string; record: DayRecord | null }) => {
      const res = v.record
        ? await sb.from("day_records").upsert({
            employee_id: v.employeeId,
            day,
            leave: v.record.leave,
            arrival_minute: v.record.arrival,
            notice_minute: v.record.notice,
          })
        : await sb.from("day_records").delete().eq("employee_id", v.employeeId).eq("day", day);
      if (res.error) fail(res.error);
    },
    onMutate: async (v) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<RecordMap>(key);
      qc.setQueryData<RecordMap>(key, (old) => {
        const next = { ...(old ?? {}) };
        if (v.record) next[v.employeeId] = v.record;
        else delete next[v.employeeId];
        return next;
      });
      return { prev };
    },
    onError: (_e, _v, ctx) => ctx && qc.setQueryData(key, ctx.prev),
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: key });
      // Results and the breakdown are built from the same records: refresh them too.
      void qc.invalidateQueries({ queryKey: ["monthRecords", monthStart(day)] });
      void qc.invalidateQueries({ queryKey: ["history"] });
    },
  });
}

/* ───────────── point values ───────────── */

export function usePointValues() {
  return useQuery({
    queryKey: ["pointValues"],
    staleTime: 60_000,
    queryFn: async (): Promise<PointValues> => {
      const r = must(await sb.from("point_values").select("*").single<PointValuesRow>());
      return {
        base: Number(r.base),
        onTime: Number(r.on_time),
        band931934: Number(r.band_931_934),
        band935940: Number(r.band_935_940),
        after940: Number(r.after_940),
        leave: Number(r.leave),
        noticeBy930: Number(r.notice_by_930),
        noticeLate: Number(r.notice_late),
      };
    },
  });
}

/* ───────────── a whole month: records, status, close / reopen, history ───────────── */

export type MonthRecords = Record<string, Record<DateKey, DayRecord>>;

export function useMonthRecords(monthFirst: DateKey) {
  return useQuery({
    queryKey: ["monthRecords", monthFirst],
    refetchInterval: 30_000,
    queryFn: async (): Promise<MonthRecords> => {
      const rows = must(
        await sb.from("day_records").select("*").gte("day", monthFirst).lte("day", monthEnd(monthFirst)).returns<DayRecordRow[]>(),
      );
      const map: MonthRecords = {};
      rows.forEach((r) => ((map[r.employee_id] ??= {})[r.day] = { arrival: r.arrival_minute, notice: r.notice_minute, leave: r.leave }));
      return map;
    },
  });
}

export interface MonthState {
  status: "open" | "closed";
  closedAt: string | null;
  closedByEmail: string | null;
  /** Point values frozen when the month was first closed. */
  savedValues: PointValues | null;
  /** The results saved at the last close. */
  savedResults: { employees: EmployeeView[] } | null;
}

const toValues = (r: Record<string, number | string>): PointValues => ({
  base: Number(r.base),
  onTime: Number(r.on_time),
  band931934: Number(r.band_931_934),
  band935940: Number(r.band_935_940),
  after940: Number(r.after_940),
  leave: Number(r.leave),
  noticeBy930: Number(r.notice_by_930),
  noticeLate: Number(r.notice_late),
});

/** null = the month has never been closed (it is simply open). */
export function useMonthState(monthFirst: DateKey) {
  return useQuery({
    queryKey: ["monthState", monthFirst],
    queryFn: async (): Promise<MonthState | null> => {
      const rows = must(await sb.from("months").select("*").eq("month", monthFirst).returns<MonthRow[]>());
      const r = rows[0];
      if (!r) return null;
      let email: string | null = null;
      if (r.closed_by) {
        const a = must(await sb.from("admins").select("user_id,email").eq("user_id", r.closed_by).returns<AdminRow[]>());
        email = a[0]?.email ?? null;
      }
      const saved = r.saved_results as { employees?: EmployeeView[] } | null;
      return {
        status: r.status,
        closedAt: r.closed_at,
        closedByEmail: email,
        savedValues: r.saved_point_values ? toValues(r.saved_point_values) : null,
        savedResults: saved?.employees ? { employees: saved.employees } : null,
      };
    },
  });
}

export function useCloseMonth() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: { monthFirst: DateKey; employees: EmployeeView[] }) => {
      const res = await sb.rpc("close_month", { p_month: v.monthFirst, p_results: { version: 1, employees: v.employees } } as never);
      if (res.error) fail(res.error);
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ["monthState"] });
      void qc.invalidateQueries({ queryKey: ["history"] });
    },
  });
}

export function useReopenMonth() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (monthFirst: DateKey) => {
      const res = await sb.rpc("reopen_month", { p_month: monthFirst } as never);
      if (res.error) fail(res.error);
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ["monthState"] });
      void qc.invalidateQueries({ queryKey: ["history"] });
    },
  });
}

/** Save or clear a record on ANY date (used from the needs-attention list and the breakdown). */
export function useSaveRecordOn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: { employeeId: string; day: DateKey; record: DayRecord | null }) => {
      const res = v.record
        ? await sb.from("day_records").upsert({
            employee_id: v.employeeId,
            day: v.day,
            leave: v.record.leave,
            arrival_minute: v.record.arrival,
            notice_minute: v.record.notice,
          })
        : await sb.from("day_records").delete().eq("employee_id", v.employeeId).eq("day", v.day);
      if (res.error) fail(res.error);
    },
    onMutate: async (v) => {
      const key = ["monthRecords", monthStart(v.day)];
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<MonthRecords>(key);
      qc.setQueryData<MonthRecords>(key, (old) => {
        const next: MonthRecords = { ...(old ?? {}) };
        const mine = { ...(next[v.employeeId] ?? {}) };
        if (v.record) mine[v.day] = v.record;
        else delete mine[v.day];
        next[v.employeeId] = mine;
        return next;
      });
      return { key, prev };
    },
    onError: (_e, _v, ctx) => ctx && qc.setQueryData(ctx.key, ctx.prev),
    onSettled: (_d, _e, v) => {
      void qc.invalidateQueries({ queryKey: ["monthRecords", monthStart(v.day)] });
      void qc.invalidateQueries({ queryKey: ["records", v.day] });
      void qc.invalidateQueries({ queryKey: ["history"] });
    },
  });
}

/** Every change made to one employee's days in a month: what, from what, to what, when, by whom. */
export function useEmployeeHistory(employeeId: string, monthFirst: DateKey) {
  return useQuery({
    queryKey: ["history", employeeId, monthFirst],
    queryFn: async (): Promise<ChangeRow[]> =>
      must(
        await sb
          .from("change_log")
          .select("*")
          .eq("employee_id", employeeId)
          .eq("entity", "day_records")
          .gte("day", monthFirst)
          .lte("day", monthEnd(monthFirst))
          .order("id", { ascending: true })
          .returns<ChangeRow[]>(),
      ),
  });
}

/* ───────────── access ───────────── */

/** Is the signed-in person still an approved Admin? (false = their email was removed) */
export function useIsAdmin() {
  return useQuery({
    queryKey: ["isAdmin"],
    staleTime: 60_000,
    refetchInterval: 5 * 60_000,
    refetchOnWindowFocus: true,
    queryFn: async (): Promise<boolean> => Boolean(must(await sb.rpc("is_admin"))),
  });
}

/* ───────────── point values: edit and history ───────────── */

export function useSavePointValues() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: PointValues) => {
      const res = await sb
        .from("point_values")
        .update({
          base: v.base,
          on_time: v.onTime,
          band_931_934: v.band931934,
          band_935_940: v.band935940,
          after_940: v.after940,
          leave: v.leave,
          notice_by_930: v.noticeBy930,
          notice_late: v.noticeLate,
        } as never)
        .eq("id", true);
      if (res.error) fail(res.error);
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ["pointValues"] });
      void qc.invalidateQueries({ queryKey: ["changeLog"] });
    },
  });
}

/* ───────────── Admin access: the approved list ───────────── */

export interface ApprovedPerson {
  email: string;
  addedAt: string;
  signedUp: boolean;
}

export function useApprovedEmails() {
  return useQuery({
    queryKey: ["approvedEmails"],
    queryFn: async (): Promise<ApprovedPerson[]> => {
      const [emails, admins] = await Promise.all([
        sb.from("approved_emails").select("email, added_at").order("added_at", { ascending: true }).returns<{ email: string; added_at: string }[]>(),
        sb.from("admins").select("email").returns<{ email: string }[]>(),
      ]);
      const signed = new Set(must(admins).map((a) => a.email));
      return must(emails).map((e) => ({ email: e.email, addedAt: e.added_at, signedUp: signed.has(e.email) }));
    },
  });
}

export function useAddApprovedEmail() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (email: string) => {
      const res = await sb.from("approved_emails").insert({ email: email.trim().toLowerCase() } as never);
      if (res.error) fail(res.error);
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ["approvedEmails"] });
      void qc.invalidateQueries({ queryKey: ["changeLog"] });
    },
  });
}

export function useRemoveApprovedEmail() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (email: string) => {
      const res = await sb.from("approved_emails").delete().eq("email", email);
      if (res.error) fail(res.error);
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ["approvedEmails"] });
      void qc.invalidateQueries({ queryKey: ["changeLog"] });
    },
  });
}

/* ───────────── the whole change history ───────────── */

export const HISTORY_PAGE = 100;

/** Newest first. `limit` grows with "Show more". */
export function useChangeLog(limit: number, entity?: string) {
  return useQuery({
    queryKey: ["changeLog", limit, entity ?? "all"],
    queryFn: async (): Promise<ChangeRow[]> => {
      let q = sb.from("change_log").select("*");
      if (entity) q = q.eq("entity", entity);
      return must(await q.order("id", { ascending: false }).limit(limit).returns<ChangeRow[]>());
    },
  });
}
