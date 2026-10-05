"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    void createClient()
      .auth.getUser()
      .then(({ data }) => setEmail(data.user?.email ?? null));
  }, []);

  return (
    <div className="mt-10 border-t border-ink/10 pt-6">
      {email && <p className="text-[14px] text-ink/60">Signed in as <b className="font-medium text-ink">{email}</b></p>}
      <button
        type="button"
        onClick={async () => {
          await createClient().auth.signOut();
          router.replace("/login");
          router.refresh();
        }}
        className="mt-3 h-12 rounded-[10px] border border-ink px-6 text-base font-medium active:bg-sand"
      >
        Sign out
      </button>
    </div>
  );
}
