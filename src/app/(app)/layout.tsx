import { AccessGate } from "@/components/AccessGate";
import { BottomNav } from "@/components/BottomNav";
import { Providers } from "../providers";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <Providers>
      <main>{children}</main>
      <BottomNav />
      <AccessGate />
    </Providers>
  );
}
