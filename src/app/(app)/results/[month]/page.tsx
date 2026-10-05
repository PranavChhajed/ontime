import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { monthFromParam } from "@/lib/dates";
import { ResultsScreen } from "@/features/results/ResultsScreen";

export const metadata: Metadata = { title: "Results · OnTime" };

export default async function Page({ params }: PageProps<"/results/[month]">) {
  const monthFirst = monthFromParam((await params).month);
  if (!monthFirst) notFound();
  return <ResultsScreen monthFirst={monthFirst} />;
}
