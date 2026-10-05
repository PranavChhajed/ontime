/** Rows exactly as the database returns them. */
export interface EmployeeRow {
  id: string;
  name: string;
  counted_from: string;
  last_working_date: string | null;
  enrollment_no?: string | null;
}
export interface WeeklyOffRow {
  id: string;
  employee_id: string;
  weekday: number;
  from_date: string;
  to_date: string | null;
}
export interface OverrideRow {
  employee_id: string;
  day: string;
  kind: "off" | "working";
}
export interface HolidayRow {
  day: string;
  name: string | null;
}
export interface DayRecordRow {
  employee_id: string;
  day: string;
  leave: boolean;
  arrival_minute: number | null;
  notice_minute: number | null;
}
export interface PointValuesRow {
  base: number | string;
  on_time: number | string;
  band_931_934: number | string;
  band_935_940: number | string;
  after_940: number | string;
  leave: number | string;
  notice_by_930: number | string;
  notice_late: number | string;
}
export interface MonthRow {
  month: string;
  status: "open" | "closed";
  closed_at: string | null;
  closed_by: string | null;
  saved_point_values: Record<string, number | string> | null;
  saved_results: unknown;
}
export interface AdminRow {
  user_id: string;
  email: string;
}
export interface ChangeRow {
  id: number;
  at: string;
  by_email: string | null;
  entity: string;
  entity_key?: string | null;
  employee_id: string | null;
  day: string | null;
  field: string;
  old_value: string | null;
  new_value: string | null;
}
