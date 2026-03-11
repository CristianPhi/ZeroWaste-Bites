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
  const [username, setUsername] = useState("")
  const [usernamePassword, setUsernamePassword] = useState("")
  const [confirmUsernamePassword, setConfirmUsernamePassword] = useState("")
  const [oldPassword, setOldPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmNewPassword, setConfirmNewPassword] = useState("")
  const [loadingUsername, setLoadingUsername] = useState(false)
  const [loadingPassword, setLoadingPassword] = useState(false)
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<"success" | "error">("success")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")

  useEffect(() => {
    setUsername(user?.username || "")
  }, [user?.username])

  const notify = (nextType: "success" | "error", nextTitle: string, nextDescription: string) => {
    setType(nextType)
    setTitle(nextTitle)
    setDescription(nextDescription)
    setOpen(true)
  }

  const saveUsername = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.email) {
      notify("error", "Belum Login", "Silakan login dulu.")
      return
    }

    if (!usernamePassword || !confirmUsernamePassword) {
      notify("error", "Data Belum Lengkap", "Isi password sekarang dan konfirmasi password.")
      return
    }

    if (usernamePassword !== confirmUsernamePassword) {
      notify("error", "Konfirmasi Salah", "Konfirmasi password sekarang tidak sama.")
      return
    }

    setLoadingUsername(true)
    try {
      const res = await fetch("/api/auth/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "change_username",
          email: user.email,
          username,
          currentPassword: usernamePassword,
          confirmCurrentPassword: confirmUsernamePassword,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        notify("error", "Gagal Menyimpan", data.error || "Perubahan tidak tersimpan")
        setLoadingUsername(false)
        return
      }

      if (data.user) {
        const nextUser = {
          id: String(data.user.id || user.id),
          name: String(data.user.name || user.name),
          email: String(data.user.email || user.email),
          username: String(data.user.username || username || ""),
          role: data.user.role || user.role,
          avatar: String(data.user.avatar || user.avatar || ""),
        }
        setUser(nextUser)
      }

      setUsernamePassword("")
      setConfirmUsernamePassword("")
      notify("success", "Username Diperbarui", "Username berhasil diganti.")
    } catch {
      notify("error", "Server Error", "Gagal terhubung ke server.")
    } finally {
      setLoadingUsername(false)
    }
  }

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.email) {
      notify("error", "Belum Login", "Silakan login dulu.")
      return
    }

    if (!oldPassword || !newPassword || !confirmNewPassword) {
      notify("error", "Data Belum Lengkap", "Isi password lama, password baru, dan konfirmasi password baru.")
      return
    }

    if (newPassword !== confirmNewPassword) {
      notify("error", "Konfirmasi Salah", "Konfirmasi password baru tidak sama.")
      return
    }

    setLoadingPassword(true)
    try {
      const res = await fetch("/api/auth/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "change_password",
          email: user.email,
          currentPassword: oldPassword,
          newPassword,
          confirmNewPassword,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        notify("error", "Gagal Menyimpan", data.error || "Perubahan tidak tersimpan")
        setLoadingPassword(false)
        return
      }

      setOldPassword("")
      setNewPassword("")
      setConfirmNewPassword("")
      notify("success", "Password Diperbarui", "Password berhasil diganti.")
    } catch {
      notify("error", "Server Error", "Gagal terhubung ke server.")
    } finally {
      setLoadingPassword(false)
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
          <h2 className="text-base font-semibold text-foreground">Change Username</h2>
          <p className="mt-1 text-sm text-muted-foreground">Ganti username dengan verifikasi password sekarang.</p>

          <form onSubmit={saveUsername} className="mt-4 space-y-3">
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
              <span className="mb-1 block text-xs text-muted-foreground">Password Sekarang</span>
              <input
                type="password"
                value={usernamePassword}
                onChange={(e) => setUsernamePassword(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2"
                placeholder="Masukkan password sekarang"
              />
            </label>

            <label className="block text-sm">
              <span className="mb-1 block text-xs text-muted-foreground">Konfirmasi Password Sekarang</span>
              <input
                type="password"
                value={confirmUsernamePassword}
                onChange={(e) => setConfirmUsernamePassword(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2"
                placeholder="Ulangi password sekarang"
              />
            </label>

            <button
              type="submit"
              disabled={loadingUsername}
              className="w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              {loadingUsername ? "Menyimpan..." : "Ganti Username"}
            </button>
          </form>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-base font-semibold text-foreground">Change Password</h2>
          <p className="mt-1 text-sm text-muted-foreground">Ganti password akun dengan password lama dan konfirmasi password baru.</p>

          <form onSubmit={savePassword} className="mt-4 space-y-3">
            <label className="block text-sm">
              <span className="mb-1 block text-xs text-muted-foreground">Password Lama</span>
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2"
              />
            </label>

            <label className="block text-sm">
              <span className="mb-1 block text-xs text-muted-foreground">Password Baru</span>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2"
              />
            </label>

            <label className="block text-sm">
              <span className="mb-1 block text-xs text-muted-foreground">Konfirmasi Password Baru</span>
              <input
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2"
              />
            </label>

            <button
              type="submit"
              disabled={loadingPassword}
              className="w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              {loadingPassword ? "Menyimpan..." : "Ganti Password"}
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
