import type { Metadata } from "next";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Sign in · OnTime" };

export default async function Page({ searchParams }: PageProps<"/login">) {
  const sp = await searchParams;
  return <LoginForm confirmFailed={sp.confirm === "failed"} />;
}
