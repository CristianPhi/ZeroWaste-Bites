"use client"

import { Camera, ChevronRight, Home, LogOut, Save, Settings, Store, User } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { AppLogo } from "@/components/app-logo"
import { useStudent } from "@/lib/student-context"

export function AdminProfileContent() {
  const { user, setUser, setVerified } = useStudent()
  const router = useRouter()
  const avatarInputRef = useRef<HTMLInputElement | null>(null)

  const [storeName, setStoreName] = useState("")
  const [storeAddress, setStoreAddress] = useState("")
  const [storeClosingTime, setStoreClosingTime] = useState("22:00")
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user) {
      router.replace("/auth/login")
      return
    }
    if (user.role !== "store_owner") {
      router.replace("/profile")
      return
    }

    ;(async () => {
      try {
        const res = await fetch(`/api/profile?email=${encodeURIComponent(user.email)}`)
        const data = await res.json()
        if (!res.ok) return

        const owner = data?.storeOwner || {}
        setStoreName(String(owner?.storeName || user.name || ""))
        setStoreAddress(String(owner?.storeAddress || ""))
        setStoreClosingTime(String(owner?.storeClosingTime || "22:00"))

        if (data?.profile?.avatar) {
          setUser({
            id: String(data.profile.id || user.id),
            name: String(data.profile.name || user.name),
            email: String(data.profile.email || user.email),
            username: String(data.profile.username || user.username || ""),
            role: (data.profile.role || user.role) as "customer" | "store_owner",
            avatar: String(data.profile.avatar),
          })
        }
      } catch {
        // ignore
      }
    })()
  }, [user, router, setUser])

  const uploadLocalImage = async (file: File) => {
    const fd = new FormData()
    fd.append("file", file)

    const res = await fetch("/api/upload", {
      method: "POST",
      body: fd,
    })
    const data = await res.json()
    if (!res.ok || !data?.url) throw new Error(data?.error || "Upload gagal")
    return String(data.url)
  }

  const handleAvatarUpload = async (file: File) => {
    if (!user?.email) return
    setAvatarUploading(true)
    try {
      const avatarUrl = await uploadLocalImage(file)
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          avatar: avatarUrl,
          storeAvatar: avatarUrl,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data?.profile) return

      setUser({
        id: String(data.profile.id || user.id),
        name: String(data.profile.name || user.name),
        email: String(data.profile.email || user.email),
        username: String(data.profile.username || user.username || ""),
        role: (data.profile.role || user.role) as "customer" | "store_owner",
        avatar: String(data.profile.avatar || avatarUrl),
      })
    } finally {
      setAvatarUploading(false)
    }
  }

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.email) return

    setSaving(true)
    try {
      await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          storeName,
          storeAddress,
          storeClosingTime,
        }),
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-5 pb-6">
      <header>
        <Link href="/admin" aria-label="Go to Dashboard">
          <AppLogo alt="ZeroWaste Bites" className="h-16 w-auto" priority />
        </Link>
      </header>

      <div className="flex items-center gap-4">
        <div className="relative h-16 w-16">
          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-primary/10">
            {user?.avatar ? (
              <Image src={user.avatar} alt={user.name || "Avatar"} fill className="object-cover" sizes="64px" />
            ) : (
              <User className="h-7 w-7 text-primary" />
            )}
          </div>
          <button
            type="button"
            onClick={() => avatarInputRef.current?.click()}
            disabled={avatarUploading}
            className="absolute -right-1 -bottom-1 rounded-full bg-primary p-1.5 text-primary-foreground"
            aria-label="Upload avatar"
          >
            <Camera className="h-3 w-3" />
          </button>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0]
              if (!file) return
              await handleAvatarUpload(file)
              e.currentTarget.value = ""
            }}
          />
        </div>

        <div>
          <h1 className="text-lg font-bold text-foreground">{storeName || user?.name || "Store Owner"}</h1>
          <p className="text-xs text-muted-foreground">{user?.email ?? "Not signed in"}</p>
          <p className="mt-1 text-[11px] font-medium text-primary">Store Owner</p>
        </div>
      </div>

      <form onSubmit={saveProfile} className="rounded-xl bg-card p-4 shadow-sm ring-1 ring-border/50">
        <div className="mb-3 flex items-center gap-2">
          <Store className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Store Profile</h2>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="text-xs text-muted-foreground">
            Store name
            <input
              type="text"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
              placeholder="Nama toko kamu"
            />
          </label>

          <label className="text-xs text-muted-foreground">
            Closing time
            <input
              type="time"
              value={storeClosingTime}
              onChange={(e) => setStoreClosingTime(e.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
            />
          </label>

          <label className="text-xs text-muted-foreground md:col-span-2">
            Store address
            <input
              type="text"
              value={storeAddress}
              onChange={(e) => setStoreAddress(e.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
              placeholder="Alamat toko"
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="mt-3 inline-flex items-center gap-2 rounded-xl bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground"
        >
          <Save className="h-4 w-4" />
          {saving ? "Saving..." : "Save Store Profile"}
        </button>
      </form>

      <div className="flex flex-col overflow-hidden rounded-xl bg-card shadow-sm ring-1 ring-border/50">
        <Link
          href="/admin"
          className="flex items-center gap-3 border-b border-border px-4 py-3.5 text-left transition-colors hover:bg-secondary/50"
        >
          <Home className="h-4 w-4 text-muted-foreground" />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Dashboard</p>
            <p className="text-[11px] text-muted-foreground">Back to upload and analytics</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>

        <Link
          href="/settings"
          className="flex items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-secondary/50"
        >
          <Settings className="h-4 w-4 text-muted-foreground" />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Settings</p>
            <p className="text-[11px] text-muted-foreground">Change account settings</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>
      </div>

      <button
        onClick={() => {
          try {
            localStorage.removeItem("user")
            localStorage.removeItem("rememberMe")
            sessionStorage.removeItem("user")
          } catch {
            // ignore
          }

          setUser(null)
          setVerified(false)
          router.push("/auth/login")
        }}
        className="flex items-center justify-center gap-2 rounded-xl bg-destructive/10 py-3 text-sm font-medium text-destructive transition-colors hover:bg-destructive/20"
      >
        <LogOut className="h-4 w-4" />
        Sign Out
      </button>
    </div>
  )
}
