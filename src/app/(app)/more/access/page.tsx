import type { Metadata } from "next";
import { AccessScreen } from "@/features/access/AccessScreen";

export const metadata: Metadata = { title: "Admin access · OnTime" };

export default function Page() {
  return <AccessScreen />;
}
