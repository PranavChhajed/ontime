import type { Metadata } from "next";
import { EmployeesScreen } from "@/features/employees/EmployeesScreen";

export const metadata: Metadata = { title: "Employees · OnTime" };

export default function Page() {
  return <EmployeesScreen />;
}
