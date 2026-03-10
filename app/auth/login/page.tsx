"use client"

import React, { useState } from "react"
import Link from "next/link"
import Image from "next/image"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()
      setLoading(false)

      if (data.ok) {
        if (data.user) {
          localStorage.setItem("user", JSON.stringify(data.user))
        }
        toast({ title: "Login Berhasil!", description: "Selamat datang kembali.", variant: "default" })
        setTimeout(() => { window.location.href = "/" }, 1200)
      } else {
        toast({ title: "Login Gagal", description: data.error || "Email atau password salah", variant: "destructive" })
      }
    } catch (err) {
      setLoading(false)
      toast({ title: "Server Error", description: "Gagal terhubung ke server", variant: "destructive" })
    }
  }

  return (
    <div className="mx-auto w-full max-w-md px-4 py-12">
      <header className="mb-8 text-center">
        <Link href="/" className="inline-block">
          <Image src="/images/Logo.png" alt="Logo" width={180} height={40} priority />
        </Link>
        <h1 className="mt-4 text-xl font-bold text-foreground">Sign In</h1>
      </header>

      <form onSubmit={handleLogin} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-muted-foreground">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="rounded-md border border-border bg-background p-2 text-foreground placeholder:text-muted-foreground"
            placeholder="nama@email.com"
          />
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-muted-foreground">Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="rounded-md border border-border bg-background p-2 text-foreground placeholder:text-muted-foreground"
            placeholder="Masukkan password"
          />
        </div>

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
    </div>
  )
}
