"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Eye, EyeOff } from "lucide-react"
import { AuthFeedbackModal } from "@/components/auth-feedback-modal"

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
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
        body: JSON.stringify({ name, email, password, phone }),
      })
      const data = await res.json()
      setLoading(false)
      if (!res.ok) {
        showFeedback("error", "Register Gagal", data.error || "Registration failed")
        return
      }

      // after register, navigate to login with email prefilled
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
    <div className="mx-auto w-full max-w-5xl px-4 py-12">
      <header className="mb-4">
        <Link href="/" aria-label="Go to Feed">
          <Image src="/images/Logo.png" alt="ZeroWaste Bites" width={180} height={36} className="h-16 w-auto" priority />
        </Link>
        <h1 className="mt-2 text-center text-lg font-semibold tracking-tight text-foreground">Register</h1>
      </header>
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <label className="flex flex-col text-sm">
            <span className="mb-1 text-xs text-muted-foreground">Full name</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="rounded-md border px-3 py-2"
            />
          </label>

          <label className="flex flex-col text-sm">
            <span className="mb-1 text-xs text-muted-foreground">Phone number</span>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="rounded-md border px-3 py-2"
            />
          </label>

        <label className="flex flex-col text-sm">
          <span className="mb-1 text-xs text-muted-foreground">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="rounded-md border px-3 py-2"
          />
        </label>

        <label className="flex flex-col text-sm">
          <span className="mb-1 text-xs text-muted-foreground">Password</span>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-md border px-3 py-2 pr-10"
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
        </label>

        <label className="flex flex-col text-sm">
          <span className="mb-1 text-xs text-muted-foreground">Confirm Password</span>
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
          className="mt-2 rounded-md bg-primary px-4 py-2 text-white disabled:opacity-60"
          disabled={loading}
        >
          {loading ? "Creating…" : "Create account"}
        </button>
      </form>

      <p className="mt-4 text-sm">
        Already have an account? <Link href="/auth/login" className="text-primary">Sign in</Link>
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
