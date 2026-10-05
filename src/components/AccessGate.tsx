"use client";

import { useRouter } from "next/navigation";
import { useIsAdmin } from "@/data/queries";
import { createClient } from "@/lib/supabase/client";

/**
 * Covers the app when the signed-in person is no longer an approved Admin
 * (their email was removed). The database already refuses everything for them;
 * this makes that clear instead of showing an empty, confusing app.
 */
export function AccessGate() {
  const router = useRouter();
  const { data } = useIsAdmin();
  if (data !== false) return null;

  return (
    <div role="alertdialog" aria-modal="true" aria-labelledby="access-title" className="fixed inset-0 z-[100] grid place-items-center overflow-y-auto bg-cream px-6">
      <div className="w-full max-w-md">
        <div className="font-display text-[26px] leading-none font-light tracking-[-0.03em]">OnTime</div>
        <h1 id="access-title" className="mt-8 font-display text-[44px] leading-[0.95] font-light tracking-[-0.04em]">
          Your access has <em className="underline decoration-chartreuse decoration-[6px] underline-offset-4">ended</em>
        </h1>
        <p className="mt-4 text-[17px] leading-snug text-ink/80">
          This email is no longer approved to use OnTime. Ask an Admin to approve it again, then sign in.
        </p>
        <button
          type="button"
          onClick={async () => {
            await createClient().auth.signOut();
            router.replace("/login");
            router.refresh();
          }}
          className="mt-8 h-14 w-full rounded-[10px] bg-terracotta text-lg font-medium text-ink active:scale-[0.99]"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
