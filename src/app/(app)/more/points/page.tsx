import type { Metadata } from "next";
import { PointsScreen } from "@/features/points/PointsScreen";

export const metadata: Metadata = { title: "Point values · OnTime" };

export default function Page() {
  return <PointsScreen />;
}
