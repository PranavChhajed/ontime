import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-5 py-10">
      <div className="font-display text-[26px] leading-none font-light tracking-[-0.03em]">OnTime</div>
      <h1 className="mt-10 font-display text-[44px] leading-[0.95] font-light tracking-[-0.04em]">
        That page isn’t <em className="underline decoration-chartreuse decoration-[6px] underline-offset-4">here</em>
      </h1>
      <p className="mt-4 text-[17px] leading-snug text-ink/80">The link may be old or mistyped.</p>
      <Link href="/" className="mt-8 grid h-14 place-items-center rounded-[10px] bg-terracotta text-lg font-medium text-ink">
        Back to Today
      </Link>
    </main>
  );
}
