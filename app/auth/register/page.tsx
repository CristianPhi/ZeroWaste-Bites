"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import Image from "next/image"

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      // validate phone starts with +62
      if (!phone || !phone.startsWith("+62")) {
        setLoading(false)
        return alert("Phone number must start with +62")
      }

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, phone }),
      })
      const data = await res.json()
      setLoading(false)
      if (!res.ok) {
        alert(data.error || "Registration failed")
        return
      }

      // send OTP to phone (real SMS if Twilio configured)
      try {
        await fetch("/api/auth/send-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone }),
        })
      } catch {
        // ignore
      }

      // after register, navigate to login with email prefilled
      router.push(`/auth/login?email=${encodeURIComponent(email)}`)
    } catch (err) {
      setLoading(false)
      alert("Registration error")
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
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="rounded-md border px-3 py-2"
          />
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
    </div>
  )
}
