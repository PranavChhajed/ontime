"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useGateLocked } from "@/features/gate/lock";

/** While this device is in Gate mode, every page other than the gate bounces back to it. */
export function GateLock() {
  const locked = useGateLocked();
  const path = usePathname();
  const router = useRouter();
  useEffect(() => {
    if (locked && path !== "/gate") router.replace("/gate");
  }, [locked, path, router]);
  return null;
}
