/* eslint-disable @next/next/no-img-element -- signed storage links change; next/image would add nothing here */

/** Warm-palette backgrounds for people without a photo; the same name always gets the same colour. */
const TINTS = ["bg-clay text-ink", "bg-chartreuse text-ink", "bg-sand text-ink", "bg-terracotta text-ink", "bg-olive text-cream"];

export function initialsOf(name: string): string {
  const words = name.replace(/^sample\s+/i, "").trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  const first = Array.from(words[0])[0] ?? "?";
  const last = words.length > 1 ? (Array.from(words[words.length - 1])[0] ?? "") : "";
  return (first + last).toUpperCase();
}

function tintOf(name: string): string {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.codePointAt(0)!) >>> 0;
  return TINTS[h % TINTS.length];
}

/**
 * A person's photo, or their initials on a colour. Purely decorative: the name is
 * always written next to it, so screen readers skip it.
 */
export function Avatar({ name, src, className = "size-11 text-[15px]" }: { name: string; src?: string | null; className?: string }) {
  return (
    <span aria-hidden className={`relative grid shrink-0 place-items-center overflow-hidden rounded-full font-medium ${tintOf(name)} ${className}`}>
      {src ? <img src={src} alt="" draggable={false} className="size-full object-cover" /> : initialsOf(name)}
    </span>
  );
}
