import type { Metadata } from "next";
import Link from "next/link";
import { SignOutButton } from "./SignOutButton";

export const metadata: Metadata = { title: "More · OnTime" };

const ITEMS = [
  { href: "/more/employees", title: "Employees", note: "Add, edit or remove people, and set weekly offs" },
  { href: "/more/points", title: "Point values", note: "What each arrival time and notice earns" },
  { href: "/more/access", title: "Admin access", note: "Who can sign in to OnTime" },
  { href: "/more/history", title: "History", note: "Every change, with who and when" },
  { href: "/welcome", title: "Welcome tour", note: "Replay the quick introduction" },
];

export default function Page() {
  return (
    <div className="mx-auto w-full max-w-xl px-4 pt-[max(1.5rem,env(safe-area-inset-top))] pb-32">
      <h1 className="font-display text-[44px] leading-none font-light tracking-[-0.04em]">More</h1>
      <ul className="mt-6 space-y-2.5">
        {ITEMS.map((i) => (
          <li key={i.href}>
            <Link href={i.href} className="flex items-center justify-between gap-3 rounded-[18px] bg-linen px-4 py-4 ring-1 ring-ink/10 active:bg-sand/60">
              <span>
                <span className="block text-[17px] font-medium">{i.title}</span>
                <span className="block text-[13px] text-ink/60">{i.note}</span>
              </span>
              <span aria-hidden className="text-ink/40">›</span>
            </Link>
          </li>
        ))}
      </ul>
      <SignOutButton />
    </div>
  );
}
