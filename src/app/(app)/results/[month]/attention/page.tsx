import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { monthFromParam } from "@/lib/dates";
import { AttentionScreen } from "@/features/results/AttentionScreen";

export const metadata: Metadata = { title: "Needs fixing · OnTime" };

export default async function Page({ params }: PageProps<"/results/[month]/attention">) {
  const monthFirst = monthFromParam((await params).month);
  if (!monthFirst) notFound();
  return <AttentionScreen monthFirst={monthFirst} />;
}
