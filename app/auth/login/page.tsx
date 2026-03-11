"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useEffect } from "react"
import { Eye, EyeOff, Leaf } from "lucide-react"
import { AuthFeedbackModal } from "@/components/auth-feedback-modal"
import { AppLogo } from "@/components/app-logo"

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
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
    "w-full rounded-lg border border-border bg-background/50 px-4 py-3 text-foreground placeholder:text-muted-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:border-primary"

  useEffect(() => {
    try {
      const remembered = localStorage.getItem("user")
      const sessionUser = sessionStorage.getItem("user")
      if (remembered || sessionUser) {
        window.location.href = "/"
      }
    } catch {
      // ignore
    }
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      })

      const data = await res.json()
      setLoading(false)

      if (data.ok) {
        if (data.user) {
          if (rememberMe) {
            localStorage.setItem("rememberMe", "true")
            localStorage.setItem("user", JSON.stringify(data.user))
            sessionStorage.removeItem("user")
          } else {
            localStorage.removeItem("rememberMe")
            localStorage.removeItem("user")
            sessionStorage.setItem("user", JSON.stringify(data.user))
          }
        }
        showFeedback("success", "Login Berhasil", "Selamat datang kembali.")
        setTimeout(() => {
          window.location.href = data.user?.role === "store_owner" ? "/admin" : "/"
        }, 1200)
      } else {
        showFeedback("error", "Login Gagal", data.error || "Email atau password salah")
      }
    } catch (err) {
      setLoading(false)
      showFeedback("error", "Server Error", "Gagal terhubung ke server")
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
          {/* Left side - Visual interest */}
          <div className="mb-8 hidden md:block">
            <div className="flex items-center gap-3">
              <Leaf className="h-6 w-6 text-primary" />
              <h1 className="text-3xl font-bold tracking-tight">Welcome Back</h1>
            </div>
            <p className="mt-2 text-muted-foreground">
              Save food. Save money. Save the planet.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-foreground">
                Email atau Username
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                className={inputClass}
                placeholder="masukkan email atau username"
              />
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-foreground">
                  Password
                </label>
                <Link 
                  href="/auth/forgot-password" 
                  className="text-xs font-medium text-primary hover:opacity-80 transition-opacity"
                >
                  Lupa password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className={`${inputClass} pr-10`}
                  placeholder="masukkan password"
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

            <label className="flex items-center gap-2.5 text-sm font-medium text-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-2 border-border cursor-pointer accent-primary"
              />
              Ingat saya
            </label>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 rounded-lg bg-primary px-4 py-3 font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors"
            >
              {loading ? "Sedang masuk..." : "Masuk"}
            </button>
          </form>

          {/* Sign up link */}
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Belum punya akun?{" "}
            <Link href="/auth/register" className="font-bold text-primary hover:opacity-80 transition-opacity">
              Daftar sekarang
            </Link>
          </p>

          {/* Social proof / Benefits */}
          <div className="mt-8 rounded-lg border border-border/50 bg-card/50 p-4 text-center">
            <p className="text-xs font-medium text-muted-foreground">
              Bergabung dengan ribuan pengguna yang sudah menyelamatkan makanan dan uang
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
