"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { useStudent } from "@/lib/student-context"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [otpSent, setOtpSent] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [awaitingOtp, setAwaitingOtp] = useState(false)
  const { setVerified, setUser } = useStudent()

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      const e = params.get("email")
      if (e) setEmail(e)
    } catch {
      // ignore
    }
  }, [])

  const sendOtp = async () => {
    if (!email) return alert("Enter your email so we can find your phone")
    setLoading(true)
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      setLoading(false)
      if (!res.ok) return alert(data.error || "Failed to send OTP")
      setOtpSent(data.code)
      setAwaitingOtp(true)
      if (data.code) alert(`OTP sent (dev): ${data.code}`)
      else alert("OTP sent to your phone")
    } catch (err) {
      setLoading(false)
      alert("OTP send error")
    }
  }

  const verifyOtp = async () => {
    if (!email || !otp) return alert("Enter email and OTP")
    setLoading(true)
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: otp }),
      })
      const data = await res.json()
      setLoading(false)
      if (!res.ok) return alert(data.error || "OTP verification failed")
      setUser({ id: data.id, name: data.name, email: data.email })
      setVerified(true)
      router.push("/")
    } catch (err) {
      setLoading(false)
      alert("OTP verify error")
    }
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await sendOtp()
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-12">
      <header className="mb-4">
        <Link href="/" aria-label="Go to Feed">
          <Image src="/images/Logo.png" alt="ZeroWaste Bites" width={180} height={36} className="h-16 w-auto" priority />
        </Link>
        <h1 className="mt-2 text-center text-lg font-semibold tracking-tight text-foreground">Sign In</h1>
      </header>
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
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

        <button
          type="submit"
          className="mt-2 rounded-md bg-primary px-4 py-2 text-white disabled:opacity-60"
          disabled={loading}
        >
          {loading ? "Sending OTP…" : "Send OTP"}
        </button>
      </form>

      {awaitingOtp && (
        <div className="my-4 border-t pt-4">
          <p className="mb-2 text-sm text-muted-foreground">Enter the OTP sent to your phone</p>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="flex-1 rounded-md border px-3 py-2"
            />
            <button
              onClick={verifyOtp}
              className="rounded-md bg-primary px-3 py-2 text-sm text-white"
            >
              {loading ? "Verifying…" : "Verify OTP"}
            </button>
          </div>
          <div className="mt-2 text-sm">
            <button onClick={sendOtp} className="text-primary underline">Resend OTP</button>
          </div>
        </div>
      )}

      <p className="mt-4 text-sm">
        Don’t have an account? <Link href="/auth/register" className="text-primary">Register</Link>
      </p>
    </div>
  )
}
