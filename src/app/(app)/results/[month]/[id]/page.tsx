import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { monthFromParam } from "@/lib/dates";
import { BreakdownScreen } from "@/features/results/BreakdownScreen";

export const metadata: Metadata = { title: "Breakdown · OnTime" };

export default async function Page({ params }: PageProps<"/results/[month]/[id]">) {
  const { month, id } = await params;
  const monthFirst = monthFromParam(month);
  if (!monthFirst) notFound();
  return <BreakdownScreen monthFirst={monthFirst} employeeId={id} />;
}
