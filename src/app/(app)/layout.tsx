import { AccessGate } from "@/components/AccessGate";
import { BottomNav } from "@/components/BottomNav";
import { GateLock } from "@/components/GateLock";
import { Providers } from "../providers";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <Providers>
      <main>{children}</main>
      <BottomNav />
      <AccessGate />
      <GateLock />
    </Providers>
  );
}
