import type { Metadata } from "next";
import { HistoryScreen } from "@/features/history/HistoryScreen";

export const metadata: Metadata = { title: "History · OnTime" };

export default function Page() {
  return <HistoryScreen />;
}
