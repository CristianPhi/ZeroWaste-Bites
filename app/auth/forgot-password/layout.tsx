import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Forgot Password",
  description: "Recover your ZeroWaste Bites account password via OTP email.",
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: "/auth/forgot-password",
  },
};

export default function ForgotPasswordLayout({ children }: { children: ReactNode }) {
  return children;
}
