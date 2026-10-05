import type { Metadata } from "next";
import { ResetPasswordForm } from "./ResetPasswordForm";

export const metadata: Metadata = { title: "New password · OnTime" };

export default function Page() {
  return <ResetPasswordForm />;
}
