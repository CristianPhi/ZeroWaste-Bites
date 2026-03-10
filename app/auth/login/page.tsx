"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useEffect } from "react"
import { Eye, EyeOff } from "lucide-react"
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
    "w-full rounded-md border-2 border-emerald-600/35 bg-background/65 p-2 text-foreground placeholder:text-muted-foreground dark:border-emerald-300/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/40"

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
    <div className="mx-auto w-full max-w-md px-4 py-12">
      <header className="mb-8 text-center">
        <Link href="/" className="block">
          <AppLogo alt="Logo" className="mx-auto h-10 w-auto" priority />
        </Link>
      </header>

      <form onSubmit={handleLogin} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-muted-foreground">Email atau Username</span>
          <input
            type="text"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
            className={inputClass}
            placeholder="email atau username"
          />
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Password</span>
            <Link href="/auth/forgot-password" className="text-xs font-medium text-primary hover:underline">Lupa password?</Link>
          </div>
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
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
              aria-label={showPassword ? "Sembunyikan password" : "Lihat password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="h-4 w-4 rounded border-emerald-500/60"
          />
          Remember me
        </label>

        <button
          type="submit"
          disabled={loading}
          className="mt-2 rounded-md bg-primary py-2 font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? "Sabar ya..." : "Login"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm">
        Belum punya akun? <Link href="/auth/register" className="font-bold text-primary">Daftar Sekarang</Link>
      </p>

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
