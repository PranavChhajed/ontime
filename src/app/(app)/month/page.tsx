import type { Metadata } from "next";
import { MonthScreen } from "@/features/month/MonthScreen";

export const metadata: Metadata = { title: "Month · OnTime" };

export default function Page() {
  return <MonthScreen />;
}
