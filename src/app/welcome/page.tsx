import type { Metadata } from "next";
import { Onboarding } from "@/features/onboarding/Onboarding";

export const metadata: Metadata = { title: "Welcome · OnTime" };

export default function Page() {
  return <Onboarding />;
}
