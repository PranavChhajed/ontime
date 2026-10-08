import type { Metadata } from "next";
import { GateScreen } from "@/features/gate/GateScreen";

export const metadata: Metadata = { title: "Gate · OnTime" };

export default function Page() {
  return <GateScreen />;
}
