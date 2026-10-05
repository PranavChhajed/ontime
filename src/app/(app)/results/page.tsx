import type { Metadata } from "next";
import { CurrentMonthRedirect } from "@/features/results/CurrentMonthRedirect";

export const metadata: Metadata = { title: "Results · OnTime" };

export default function Page() {
  return <CurrentMonthRedirect />;
}
