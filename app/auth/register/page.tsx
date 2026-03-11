"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Sprout } from "lucide-react"
import { AuthFeedbackModal } from "@/components/auth-feedback-modal"
import { AppLogo } from "@/components/app-logo"

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [role, setRole] = useState<"customer" | "store_owner">("customer")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [feedbackType, setFeedbackType] = useState<"success" | "error">("success")
  const [feedbackTitle, setFeedbackTitle] = useState("")
  const [feedbackDescription, setFeedbackDescription] = useState("")

  const showFeedback = (type: "success" | "error", title: string, description: string) => {
    setFeedbackType(type)
    setFeedbackTitle(title)
    setFeedbackDescription(description)
    setFeedbackOpen(true)
  }

  const inputClass =
    "w-full rounded-lg border border-border bg-background/50 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:border-primary"

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      showFeedback("error", "Password Tidak Sama", "Konfirmasi password harus sama dengan password.")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, username, email, password, phone, role }),
      })
      const data = await res.json()
      setLoading(false)
      if (!res.ok) {
        showFeedback("error", "Register Gagal", data.error || "Registration failed")
        return
      }

      showFeedback("success", "Register Berhasil", "Akun berhasil dibuat.")
      setTimeout(() => {
        router.push(`/auth/login?email=${encodeURIComponent(email)}`)
      }, 1200)
    } catch (err) {
      setLoading(false)
      showFeedback("error", "Server Error", "Registration error")
    }
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-background via-background to-background/95">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -right-40 -top-40 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -left-32 bottom-0 h-64 w-64 rounded-full bg-primary/3 blur-3xl" />
      </div>

      {/* Header with logo */}
      <header className="absolute top-0 right-0 left-0 z-10 flex items-center justify-between px-6 py-4">
        <div className="flex-1" />
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <AppLogo alt="ZeroWaste Bites" className="h-8 w-auto" priority />
        </Link>
        <div className="flex-1" />
      </header>

      {/* Main content */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 pt-16">
        <div className="w-full max-w-md">
          {/* Heading */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Sprout className="h-6 w-6 text-primary" />
              <h1 className="text-3xl font-bold tracking-tight">Bergabunglah dengan kami</h1>
            </div>
            <p className="text-muted-foreground text-sm">
              Mulai hemat makanan dan uang hari ini
            </p>
          </div>

          {/* Form */}
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 md:col-span-1 flex flex-col gap-2">
                <label className="text-sm font-semibold text-foreground">Nama Lengkap</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className={inputClass}
                  placeholder="Nama Anda"
                />
              </div>

              <div className="col-span-2 md:col-span-1 flex flex-col gap-2">
                <label className="text-sm font-semibold text-foreground">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className={inputClass}
                  placeholder="username"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-foreground">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={inputClass}
                placeholder="email@example.com"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-foreground">Nomor Telepon</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className={inputClass}
                placeholder="08xx xxxx xxxx"
              />
            </div>

            <div className="flex flex-col gap-3 rounded-lg border border-border/50 bg-card/50 p-4">
              <label className="text-sm font-semibold text-foreground">Saya Mendaftar Sebagai</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole("customer")}
                  className={`rounded-lg border-2 px-3 py-2.5 text-sm font-medium transition-all ${
                    role === "customer"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-foreground hover:border-border/80"
                  }`}
                >
                  Pembeli
                </button>
                <button
                  type="button"
                  onClick={() => setRole("store_owner")}
                  className={`rounded-lg border-2 px-3 py-2.5 text-sm font-medium transition-all ${
                    role === "store_owner"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-foreground hover:border-border/80"
                  }`}
                >
                  Pemilik Toko
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-foreground">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className={`${inputClass} pr-10`}
                  placeholder="Masukkan password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? "Sembunyikan password" : "Lihat password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-foreground">Konfirmasi Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className={`${inputClass} pr-10`}
                  placeholder="Konfirmasi password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showConfirmPassword ? "Sembunyikan konfirmasi password" : "Lihat konfirmasi password"}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="mt-2 rounded-lg bg-primary px-4 py-3 font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors"
              disabled={loading}
            >
              {loading ? "Membuat akun..." : "Buat Akun"}
            </button>
          </form>

          {/* Sign in link */}
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Sudah punya akun?{" "}
            <Link href="/auth/login" className="font-bold text-primary hover:opacity-80 transition-opacity">
              Masuk di sini
            </Link>
          </p>

          {/* Features */}
          <div className="mt-8 rounded-lg border border-border/50 bg-card/50 p-4">
            <p className="text-xs font-medium text-muted-foreground text-center">
              Dapatkan akses ke penawaran eksklusif dan selamatkan makanan dari pemborosan
            </p>
          </div>
        </div>
      </div>

      <AuthFeedbackModal
        open={feedbackOpen}
        title={feedbackTitle}
        description={feedbackDescription}
        type={feedbackType}
        onClose={() => setFeedbackOpen(false)}
      />
    </div>
  )
}
