"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { AuthFeedbackModal } from "@/components/auth-feedback-modal";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [identifier, setIdentifier] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState<"success" | "error">("success");
  const [feedbackTitle, setFeedbackTitle] = useState("");
  const [feedbackDescription, setFeedbackDescription] = useState("");

  const showFeedback = (type: "success" | "error", title: string, description: string) => {
    setFeedbackType(type);
    setFeedbackTitle(title);
    setFeedbackDescription(description);
    setFeedbackOpen(true);
  };

  const emailLocked = Boolean(email);

  const requestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        showFeedback("error", "Gagal", data.error || "Gagal mengirim OTP");
        return;
      }

      setStep(2);
      if (data.email) {
        setEmail(String(data.email));
      } else if (identifier.includes("@")) {
        setEmail(identifier);
      }

      if (data.devMode && data.devOtp) {
        showFeedback("success", "Mode Development", `OTP testing: ${data.devOtp}`);
      } else {
        showFeedback("success", "OTP Terkirim", "Cek email kamu untuk kode reset password.");
      }
    } catch {
      setLoading(false);
      showFeedback("error", "Server Error", "Gagal terhubung ke server.");
    }
  };

  const submitReset = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      showFeedback("error", "Password Tidak Sama", "Konfirmasi password harus sama.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: otp, newPassword }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        showFeedback("error", "Reset Gagal", data.error || "Reset password gagal");
        return;
      }

      showFeedback("success", "Password Diperbarui", "Silakan login dengan password baru.");
      setTimeout(() => {
        window.location.href = "/auth/login";
      }, 1300);
    } catch {
      setLoading(false);
      showFeedback("error", "Server Error", "Gagal terhubung ke server.");
    }
  };

  return (
    <main className="mx-auto w-full max-w-md px-4 py-12">
      <h1 className="text-xl font-bold text-foreground">Forgot Password</h1>
      <p className="mt-2 text-sm text-muted-foreground">Reset password akun kamu lewat OTP yang dikirim ke email.</p>

      {step === 1 ? (
        <form onSubmit={requestOtp} className="mt-6 space-y-4">
          <label className="block text-sm">
            <span className="mb-1 block text-xs text-muted-foreground">Email atau Username</span>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              className="w-full rounded-md border px-3 py-2"
              placeholder="email atau username"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-primary px-4 py-2 font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            {loading ? "Mengirim..." : "Kirim OTP"}
          </button>
        </form>
      ) : (
        <form onSubmit={submitReset} className="mt-6 space-y-4">
          <label className="block text-sm">
            <span className="mb-1 block text-xs text-muted-foreground">Email akun</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              readOnly={emailLocked}
              className={`w-full rounded-md border px-3 py-2 ${emailLocked ? "bg-muted/40 text-muted-foreground" : ""}`}
              placeholder="nama@email.com"
            />
            {emailLocked ? (
              <span className="mt-1 block text-xs text-muted-foreground">Email terisi otomatis dari langkah sebelumnya.</span>
            ) : null}
          </label>

          <label className="block text-sm">
            <span className="mb-1 block text-xs text-muted-foreground">Kode OTP</span>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              className="w-full rounded-md border px-3 py-2"
              placeholder="6 digit OTP"
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block text-xs text-muted-foreground">Password baru</span>
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="w-full rounded-md border px-3 py-2 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword((s) => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                aria-label={showNewPassword ? "Sembunyikan password" : "Lihat password"}
              >
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </label>

          <label className="block text-sm">
            <span className="mb-1 block text-xs text-muted-foreground">Konfirmasi password baru</span>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full rounded-md border px-3 py-2 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((s) => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                aria-label={showConfirmPassword ? "Sembunyikan konfirmasi password" : "Lihat konfirmasi password"}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-primary px-4 py-2 font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            {loading ? "Menyimpan..." : "Reset Password"}
          </button>
        </form>
      )}

      <p className="mt-5 text-sm">
        <Link href="/auth/login" className="font-medium text-primary hover:underline">
          Kembali ke Login
        </Link>
      </p>

      <AuthFeedbackModal
        open={feedbackOpen}
        title={feedbackTitle}
        description={feedbackDescription}
        type={feedbackType}
        onClose={() => setFeedbackOpen(false)}
      />
    </main>
  );
}
