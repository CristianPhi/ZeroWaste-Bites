"use client";

import { useEffect, useState } from "react";
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
  const [resendCooldown, setResendCooldown] = useState(0);

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
  const inputClass =
    "w-full rounded-md border-2 border-emerald-600/35 bg-background/65 px-3 py-2 text-foreground dark:border-emerald-300/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/40";

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

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
        showFeedback("error", "Gagal", data?.detail ? `${data.error || "Gagal mengirim OTP"} (${data.detail})` : data.error || "Gagal mengirim OTP");
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
      setResendCooldown(Number(data.resendAfterSeconds || 60));
    } catch {
      setLoading(false);
      showFeedback("error", "Server Error", "Gagal terhubung ke server.");
    }
  };

  const resendOtp = async () => {
    if (resendCooldown > 0 || loading) return;
    const activeIdentifier = identifier || email;
    if (!activeIdentifier) {
      showFeedback("error", "Data Kurang", "Isi email atau username terlebih dahulu.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: activeIdentifier }),
      });
      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        showFeedback("error", "Gagal", data?.detail ? `${data.error || "Gagal mengirim OTP ulang"} (${data.detail})` : data.error || "Gagal mengirim OTP ulang");
        return;
      }

      if (data.email) {
        setEmail(String(data.email));
      }
      setResendCooldown(Number(data.resendAfterSeconds || 60));
      showFeedback("success", "OTP Dikirim Ulang", "Silakan cek email kamu.");
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
              className={inputClass}
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
              className={`${inputClass} ${emailLocked ? "bg-muted/40 text-muted-foreground" : ""}`}
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
              className={inputClass}
              placeholder="6 digit OTP"
            />
          </label>

          <div className="flex items-center justify-between rounded-md border border-dashed px-3 py-2">
            <span className="text-xs text-muted-foreground">
              {resendCooldown > 0 ? `Kirim ulang OTP dalam ${resendCooldown} detik` : "Tidak menerima OTP?"}
            </span>
            <button
              type="button"
              onClick={resendOtp}
              disabled={resendCooldown > 0 || loading}
              className="text-xs font-semibold text-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              Resend OTP
            </button>
          </div>

          <label className="block text-sm">
            <span className="mb-1 block text-xs text-muted-foreground">Password baru</span>
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className={`${inputClass} pr-10`}
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
                className={`${inputClass} pr-10`}
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
