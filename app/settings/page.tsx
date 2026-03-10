"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useTheme } from "next-themes"
import { Moon, Sun } from "lucide-react"
import { AppLogo } from "@/components/app-logo"
import { useStudent } from "@/lib/student-context"
import { AuthFeedbackModal } from "@/components/auth-feedback-modal"

export default function SettingsPage() {
  const { user, setUser } = useStudent()
  const { theme, setTheme } = useTheme()
  const isDark = theme === "dark"
  const [name, setName] = useState("")
  const [username, setUsername] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<"success" | "error">("success")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")

  useEffect(() => {
    setName(user?.name || "")
    setUsername(user?.username || "")
  }, [user?.name, user?.username])

  const notify = (nextType: "success" | "error", nextTitle: string, nextDescription: string) => {
    setType(nextType)
    setTitle(nextTitle)
    setDescription(nextDescription)
    setOpen(true)
  }

  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.email) {
      notify("error", "Belum Login", "Silakan login dulu.")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/auth/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          name,
          username,
          currentPassword,
          newPassword,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        notify("error", "Gagal Menyimpan", data.error || "Perubahan tidak tersimpan")
        setLoading(false)
        return
      }

      if (data.user) {
        const nextUser = {
          id: String(data.user.id || user.id),
          name: String(data.user.name || name),
          email: String(data.user.email || user.email),
          username: String(data.user.username || username || ""),
          role: data.user.role || user.role,
        }
        setUser(nextUser)
      }

      setCurrentPassword("")
      setNewPassword("")
      notify("success", "Berhasil", "Pengaturan akun berhasil diperbarui.")
    } catch {
      notify("error", "Server Error", "Gagal terhubung ke server.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="w-full px-4 py-8">
      <header className="mb-6">
        <Link href="/" aria-label="Go to Feed">
          <AppLogo alt="ZeroWaste Bites" className="h-16 w-auto" priority />
        </Link>
      </header>

      <div className="mx-auto grid w-full max-w-3xl gap-4">
        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-base font-semibold text-foreground">Appearance</h2>
          <p className="mt-1 text-sm text-muted-foreground">Pilih tema aplikasi yang paling nyaman buat kamu.</p>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setTheme("light")}
              className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${
                !isDark ? "border-primary bg-primary/10 text-primary" : "border-border bg-secondary/40 text-foreground"
              }`}
            >
              <Sun className="h-4 w-4" />
              Light Mode
            </button>
            <button
              type="button"
              onClick={() => setTheme("dark")}
              className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${
                isDark ? "border-primary bg-primary/10 text-primary" : "border-border bg-secondary/40 text-foreground"
              }`}
            >
              <Moon className="h-4 w-4" />
              Dark Mode
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-base font-semibold text-foreground">Account Settings</h2>
          <p className="mt-1 text-sm text-muted-foreground">Ubah username, nama, dan password akun kamu.</p>

          <form onSubmit={saveSettings} className="mt-4 space-y-3">
            <label className="block text-sm">
              <span className="mb-1 block text-xs text-muted-foreground">Name</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2"
              />
            </label>

            <label className="block text-sm">
              <span className="mb-1 block text-xs text-muted-foreground">Username</span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2"
              />
            </label>

            <label className="block text-sm">
              <span className="mb-1 block text-xs text-muted-foreground">Current Password</span>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2"
                placeholder="Wajib diisi jika ganti password"
              />
            </label>

            <label className="block text-sm">
              <span className="mb-1 block text-xs text-muted-foreground">New Password</span>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2"
                placeholder="Kosongkan jika tidak ganti password"
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              {loading ? "Menyimpan..." : "Save Changes"}
            </button>
          </form>
        </section>
      </div>

      <AuthFeedbackModal
        open={open}
        title={title}
        description={description}
        type={type}
        onClose={() => setOpen(false)}
      />
    </main>
  )
}
