"use client";

import { useSyncExternalStore } from "react";

/**
 * Gate mode keeps a shared tablet on the arrival screen until an Admin types the PIN.
 * This is a screen lock, not a security boundary: the tablet is still signed in as an Admin,
 * so the PIN only stops casual wandering into other screens.
 */
const KEY = "ontime.gate";
const EVENT = "ontime-gate-change";

/** One-way scramble so the PIN is not sitting in storage as plain digits. */
export async function hashPin(pin: string): Promise<string> {
  const text = `ontime:${pin}`;
  try {
    const bytes = new TextEncoder().encode(text);
    const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
  } catch {
    return `plain:${text}`; // very old browsers: still works, just not scrambled
  }
}

function read(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

function subscribe(cb: () => void) {
  window.addEventListener("storage", cb);
  window.addEventListener(EVENT, cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener(EVENT, cb);
  };
}

/** True while this device is locked to the gate screen. */
export function useGateLocked(): boolean {
  return useSyncExternalStore(subscribe, () => read() !== null, () => false);
}

export const isValidPin = (pin: string) => /^\d{4}$/.test(pin);

export async function startGate(pin: string): Promise<void> {
  localStorage.setItem(KEY, await hashPin(pin));
  window.dispatchEvent(new Event(EVENT));
}

export async function checkPin(pin: string): Promise<boolean> {
  const stored = read();
  return stored !== null && stored === (await hashPin(pin));
}

export function endGate(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* nothing to clear */
  }
  window.dispatchEvent(new Event(EVENT));
}
