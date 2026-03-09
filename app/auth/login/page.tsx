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
  // Tambahkan state phone agar tidak undefined saat verifikasi
  const [phone, setPhone] = useState("") 
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
      
      // Simpan nomor HP yang didapat dari database ke state
      if (data.phone) {
        setPhone(data.phone)
      } else {
        // Jika API tidak kirim phone, kita asumsikan email sudah cukup untuk identifikasi di backend
        setPhone(email) 
      }

      setAwaitingOtp(true)
      alert("OTP sent to your email/phone")
    } catch (err) {
      setLoading(false)
      alert("OTP send error")
    }
  }

  // Samakan nama fungsi dengan yang dipanggil di tombol (verifyOtp)
  const verifyOtp = async () => {
    // Sekarang phone sudah diambil dari state, tidak akan undefined lagi
    if (!phone || !otp) {
      alert("Data tidak lengkap. Silakan kirim ulang OTP.");
      return;
    }

    setLoading(true)
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          phone: phone, 
          code: otp 
        }),
      });
      
      const data = await res.json();
      setLoading(false)

      if (data.ok) {
        // Update context student jika perlu
        if (setVerified) setVerified(true)
        alert("Login Berhasil!")
        window.location.href = "/dashboard";
      } else {
        alert(data.error || "Invalid OTP");
      }
    } catch (err) {
      setLoading(false)
      alert("Verification error");
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await sendOtp()
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-12">
      <header className="mb-4 text-center">
        <Link href="/" aria-label="Go to Feed" className="inline-block">
          <Image src="/images/Logo.png" alt="ZeroWaste Bites" width={180} height={36} className="h-16 w-auto" priority />
        </Link>
        <h1 className="mt-2 text-lg font-semibold tracking-tight text-foreground">Sign In</h1>
      </header>

      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <label className="flex flex-col text-sm">
          <span className="mb-1 text-xs text-muted-foreground">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="example@gmail.com"
            className="rounded-md border px-3 py-2 text-black"
          />
        </label>

        <button
          type="submit"
          className="mt-2 rounded-md bg-primary px-4 py-2 text-white disabled:opacity-60"
          disabled={loading}
        >
          {loading && !awaitingOtp ? "Sending OTP…" : "Send OTP"}
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
              className="flex-1 rounded-md border px-3 py-2 text-black"
            />
            <button
              type="button"
              onClick={verifyOtp}
              disabled={loading}
              className="rounded-md bg-primary px-3 py-2 text-sm text-white disabled:opacity-60"
            >
              {loading ? "Verifying…" : "Verify OTP"}
            </button>
          </div>
          <div className="mt-2 text-sm">
            <button type="button" onClick={sendOtp} className="text-primary underline">Resend OTP</button>
          </div>
        </div>
      )}

      <p className="mt-4 text-sm text-center">
        Don’t have an account? <Link href="/auth/register" className="text-primary font-bold">Register</Link>
      </p>
    </div>
  )
}
