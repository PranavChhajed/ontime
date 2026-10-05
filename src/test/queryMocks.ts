import { vi } from "vitest";
import { DEFAULT_POINT_VALUES, parseClock, type PointValues } from "@/scoring";
import type { DayRecord, Employee, HolidayMap, OverrideMap } from "@/features/today/types";
import type { MonthRecords, MonthState } from "@/data/queries";
import type { ChangeRow } from "@/data/rows";
import type { ApprovedPerson } from "@/data/queries";

/**
 * Stand-in for src/data/queries.ts so screens can be tested without a database.
 * Tests change `state` and read the vi.fn() calls to see what a screen tried to save.
 */
export const state = {
  employees: [] as Employee[],
  records: {} as Record<string, DayRecord>,
  holidays: {} as HolidayMap,
  overrides: {} as OverrideMap,
  values: DEFAULT_POINT_VALUES as PointValues,
  clock: { date: "2026-10-05", minute: parseClock("9:25") },
  monthRecords: {} as MonthRecords,
  monthState: null as MonthState | null,
  history: [] as ChangeRow[],
  isAdmin: true as boolean | undefined,
  usingServerTime: true,
  loadError: null as Error | null,
  saveRecord: vi.fn<(v: unknown) => Promise<void>>(async () => {}),
  saveEmployee: vi.fn<(v: unknown) => Promise<string>>(async () => "new-id"),
  deleteEmployee: vi.fn<(id: string) => Promise<void>>(async () => {}),
  toggleHoliday: vi.fn<(v: unknown) => Promise<void>>(async () => {}),
  setOverride: vi.fn(),
  closeMonth: vi.fn<(v: unknown) => Promise<void>>(async () => {}),
  reopenMonth: vi.fn<(m: string) => Promise<void>>(async () => {}),
  saveRecordOn: vi.fn<(v: unknown) => Promise<void>>(async () => {}),
  saveRecordOnMutate: vi.fn(),
  changeLog: [] as ChangeRow[],
  approved: [] as ApprovedPerson[],
  savePointValues: vi.fn<(v: unknown) => Promise<void>>(async () => {}),
  addEmail: vi.fn<(e: string) => Promise<void>>(async () => {}),
  removeEmail: vi.fn<(e: string) => Promise<void>>(async () => {}),
};

const query = <T,>(data: T) => ({
  data: state.loadError ? undefined : data,
  isPending: false,
  error: state.loadError,
  refetch: vi.fn(),
});

export const queryMocks = {
  useClock: () => ({ ready: true, now: () => state.clock, usingServerTime: state.usingServerTime }),
  useEmployees: () => query(state.employees),
  usePointValues: () => query(state.values),
  useDayRecords: () => query(state.records),
  useMonthCalendar: () => query({ holidays: state.holidays, overrides: state.overrides }),
  useSaveRecord: () => ({ mutateAsync: state.saveRecord, isPending: false }),
  useSaveEmployee: () => ({ mutateAsync: state.saveEmployee, isPending: false }),
  useDeleteEmployee: () => ({ mutateAsync: state.deleteEmployee, isPending: false }),
  useToggleHoliday: () => ({ mutateAsync: state.toggleHoliday, isPending: false }),
  useSetOverride: () => ({ mutate: state.setOverride, isPending: false }),
  useMonthRecords: () => query(state.monthRecords),
  useMonthState: () => query(state.monthState),
  useCloseMonth: () => ({ mutateAsync: state.closeMonth, isPending: false }),
  useReopenMonth: () => ({ mutateAsync: state.reopenMonth, isPending: false }),
  useSaveRecordOn: () => ({ mutateAsync: state.saveRecordOn, mutate: state.saveRecordOnMutate, isPending: false }),
  useEmployeeHistory: () => query(state.history),
  useIsAdmin: () => ({ data: state.isAdmin }),
  useSavePointValues: () => ({ mutateAsync: state.savePointValues, isPending: false }),
  useChangeLog: () => query(state.changeLog),
  HISTORY_PAGE: 100,
  useApprovedEmails: () => query(state.approved),
  useAddApprovedEmail: () => ({ mutateAsync: state.addEmail, isPending: false }),
  useRemoveApprovedEmail: () => ({ mutateAsync: state.removeEmail, isPending: false }),
};

export function resetState() {
  state.employees = [];
  state.records = {};
  state.holidays = {};
  state.overrides = {};
  state.values = DEFAULT_POINT_VALUES;
  state.clock = { date: "2026-10-05", minute: parseClock("9:25") };
  state.loadError = null;
  state.isAdmin = true;
  state.usingServerTime = true;
  state.monthRecords = {};
  state.monthState = null;
  state.history = [];
  state.changeLog = [];
  state.approved = [];
  [state.closeMonth, state.reopenMonth, state.saveRecordOn, state.saveRecordOnMutate, state.saveRecord, state.saveEmployee, state.deleteEmployee, state.toggleHoliday, state.setOverride, state.savePointValues, state.addEmail, state.removeEmail].forEach((f) => f.mockClear());
}

export const emp = (id: string, name: string, over: Partial<Employee> = {}): Employee => ({
  id,
  name,
  countedFrom: "2026-09-01",
  lastWorkingDate: null,
  weeklyOffs: [{ weekday: 0, from: "2026-09-01", to: null }],
  ...over,
});
