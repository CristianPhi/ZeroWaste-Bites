"use client"

import {
  Camera,
  CheckCircle2,
  ChevronRight,
  GraduationCap,
  Heart,
  Leaf,
  LogOut,
  Settings,
  Store,
  Upload,
  User,
  X,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useStudent } from "@/lib/student-context"
import { dealPosts } from "@/lib/data"
import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { AppLogo } from "@/components/app-logo"
import { AvatarCropModal } from "@/components/avatar-crop-modal"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

const menuItems = [
  { icon: Heart, label: "Saved Deals", description: "Deals you liked", href: "/saved-deals" },
  { icon: Store, label: "Favorite Stores", description: "Stores you follow", href: "/favorite-stores" },
  { icon: Settings, label: "Settings", description: "Theme and app preferences", href: "/settings" },
  { label: "About Us", description: "About ZeroWaste Bites", href: "/about" },
]

export function ProfileContent() {
  const { isVerified, setVerified, user, setUser } = useStudent()
  const [showVerifyModal, setShowVerifyModal] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [avatarUploadError, setAvatarUploadError] = useState("")
  const [avatarCropFile, setAvatarCropFile] = useState<File | null>(null)
  const [logoutOpen, setLogoutOpen] = useState(false)

  const router = useRouter()
  const avatarInputRef = useRef<HTMLInputElement | null>(null)

  const [claimedCount, setClaimedCount] = useState(0)
  const [moneySaved, setMoneySaved] = useState(0)
  const [foodRescuedKg, setFoodRescuedKg] = useState(0)

  useEffect(() => {
    if (user?.role === "store_owner") {
      router.replace("/admin/profile")
    }
  }, [user?.role, router])

  useEffect(() => {
    if (!user?.email) {
      setClaimedCount(0)
      setMoneySaved(0)
      setFoodRescuedKg(0)
      return
    }

    let mounted = true

    ;(async () => {
      try {
        const res = await fetch(`/api/orders?email=${encodeURIComponent(user.email)}`, { cache: "no-store" })
        const data = await res.json()
        const orders = Array.isArray(data?.orders) ? data.orders : []
        const completed = orders.filter((o: any) => o.status === "Completed" || o.status === "Pickup Ready")
        const legacyDealsById = new Map(dealPosts.map((deal) => [String(deal.id), deal]))

        const claimed = completed.reduce((acc: number, item: any) => {
          const qty = Math.max(1, Number(item?.quantity || 1))
          return acc + qty
        }, 0)

        const saved = Math.max(
          0,
          Math.round(
            completed.reduce((acc: number, item: any) => {
              const qty = Math.max(1, Number(item?.quantity || 1))
              const originalPrice = Number(item?.originalPrice || 0)
              const discountedPrice = Number(item?.discountedPrice || 0)

              if (originalPrice > 0 && discountedPrice >= 0) {
                return acc + Math.max(0, originalPrice - discountedPrice) * qty
              }

              const estimatedSaved = Number(item?.estimatedSaved || 0)
              if (estimatedSaved > 0) return acc + estimatedSaved

              const dealId = String(item?.dealId || "").trim()
              const legacyDeal = legacyDealsById.get(dealId)
              if (legacyDeal) {
                return (
                  acc +
                  Math.max(0, Number(legacyDeal.originalPrice || 0) - Number(legacyDeal.discountedPrice || 0)) * qty
                )
              }

              return acc
            }, 0)
          )
        )

        if (!mounted) return
        setClaimedCount(claimed)
        setMoneySaved(saved)
        setFoodRescuedKg(Number((claimed * 0.5).toFixed(1)))
      } catch {
        if (!mounted) return
        setClaimedCount(0)
        setMoneySaved(0)
        setFoodRescuedKg(0)
      }
    })()

    return () => {
      mounted = false
    }
  }, [user?.email])

  const handleVerify = () => {
    setUploading(true)
    setTimeout(() => {
      setUploading(false)
      setVerified(true)
      setShowVerifyModal(false)
    }, 2000)
  }

  const handleAvatarUpload = async (file: File) => {
    if (!user?.email) return
    setAvatarUploading(true)
    setAvatarUploadError("")
    try {
      const fd = new FormData()
      fd.append("file", file)

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: fd,
      })
      const uploadData = await uploadRes.json()
      if (!uploadRes.ok || !uploadData?.url) {
        setAvatarUploadError(String(uploadData?.error || "Gagal upload avatar"))
        return
      }

      const profileRes = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          avatar: uploadData.url,
          storeAvatar: uploadData.url,
        }),
      })
      const profileData = await profileRes.json()
      if (!profileRes.ok || !profileData?.profile) {
        setAvatarUploadError(String(profileData?.error || "Gagal update avatar"))
        return
      }

      setUser({
        id: String(profileData.profile.id || user.id),
        name: String(profileData.profile.name || user.name),
        email: String(profileData.profile.email || user.email),
        username: String(profileData.profile.username || user.username || ""),
        role: (profileData.profile.role || user.role) as "customer" | "store_owner",
        avatar: String(profileData.profile.avatar || uploadData.url),
      })
    } catch (err: any) {
      setAvatarUploadError(String(err?.message || "Gagal upload avatar"))
    } finally {
      setAvatarUploading(false)
    }
  }

  return (
    <div className="flex flex-col gap-5 pb-4">
      <header>
        <Link href="/" aria-label="Go to Feed">
          <AppLogo alt="ZeroWaste Bites" className="h-16 w-auto" priority />
        </Link>
      </header>

      <div className="flex items-center gap-4">
        <div>
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
            accept="image/png,image/jpeg,image/jpg,image/webp,image/avif,.jfif"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (!file) return
              setAvatarCropFile(file)
              e.currentTarget.value = ""
            }}
          />
          </div>
          {avatarUploadError ? <p className="mt-2 text-[11px] text-destructive">{avatarUploadError}</p> : null}
        </div>

        <div>
          <h1 className="text-lg font-bold text-foreground">{user?.username ? `@${user.username}` : user?.name ?? "Guest"}</h1>
          <p className="text-xs text-muted-foreground">{user?.email ?? "Not signed in"}</p>
          {isVerified && (
            <div className="mt-1 flex items-center gap-1">
              <GraduationCap className="h-3 w-3 text-primary" />
              <span className="text-[11px] font-medium text-primary">Verified Student</span>
            </div>
          )}
        </div>
      </div>

      {!isVerified ? (
        <button
          onClick={() => setShowVerifyModal(true)}
          className="flex items-center gap-3 rounded-xl bg-accent/10 p-4 text-left ring-1 ring-accent/20 transition-colors hover:bg-accent/15"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/20">
            <GraduationCap className="h-5 w-5 text-accent-foreground" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">Verify Student Status</p>
            <p className="text-[11px] text-muted-foreground">
              Upload your student card to get extra 20% off on all deals
            </p>
          </div>
          <ChevronRight className="h-4 w-4 text-accent-foreground" />
        </button>
      ) : (
        <div className="flex items-center gap-3 rounded-xl bg-primary/5 p-4 ring-1 ring-primary/15">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
            <CheckCircle2 className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">Student Discount Active</p>
            <p className="text-[11px] text-muted-foreground">
              You get an extra 20% off on top of every store discount
            </p>
          </div>
        </div>
      )}

      <div className="rounded-xl bg-primary/5 p-4">
        <div className="mb-3 flex items-center gap-2">
          <Leaf className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Your Impact</h2>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="flex flex-col items-center rounded-xl bg-card py-3 shadow-sm ring-1 ring-border/50">
            <span className="text-base font-bold text-foreground">{claimedCount}</span>
            <span className="mt-0.5 text-[10px] text-muted-foreground">Deals Claimed</span>
          </div>

          <div className="flex flex-col items-center rounded-xl bg-card py-3 shadow-sm ring-1 ring-border/50">
            <span className="text-base font-bold text-foreground">{moneySaved === 0 ? "Rp 0" : `Rp ${moneySaved.toLocaleString("id-ID")}`}</span>
            <span className="mt-0.5 text-[10px] text-muted-foreground">Money Saved</span>
          </div>

          <div className="flex flex-col items-center rounded-xl bg-card py-3 shadow-sm ring-1 ring-border/50">
            <span className="text-base font-bold text-foreground">{foodRescuedKg} kg</span>
            <span className="mt-0.5 text-[10px] text-muted-foreground">Food Rescued</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col overflow-hidden rounded-xl bg-card shadow-sm ring-1 ring-border/50">
        {menuItems.map((item, i) => {
          const isLast = i === menuItems.length - 1
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-secondary/50 ${
                !isLast ? "border-b border-border" : ""
              }`}
            >
              {item.label === "About Us" ? (
                <span className="flex h-5 w-5 items-center justify-center rounded-full border border-muted-foreground text-[11px] font-semibold text-muted-foreground">
                  i
                </span>
              ) : (
                item.icon && <item.icon className="h-4 w-4 text-muted-foreground" />
              )}
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{item.label}</p>
                <p className="text-[11px] text-muted-foreground">{item.description}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          )
        })}
      </div>

      <button
        onClick={() => setLogoutOpen(true)}
        className="flex items-center justify-center gap-2 rounded-xl bg-destructive/10 py-3 text-sm font-medium text-destructive transition-colors hover:bg-destructive/20"
      >
        <LogOut className="h-4 w-4" />
        Sign Out
      </button>

      {showVerifyModal && (
        <div className="fixed inset-0 z-60 flex items-end justify-center bg-foreground/40 backdrop-blur-sm">
          <div className="mx-auto w-full max-w-md animate-in slide-in-from-bottom rounded-t-2xl bg-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold text-foreground">Verify Student Status</h2>
              <button
                onClick={() => setShowVerifyModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary"
                aria-label="Close"
              >
                <X className="h-4 w-4 text-foreground" />
              </button>
            </div>

            <p className="text-sm text-muted-foreground">
              Upload a photo of your student card (KTM) to verify your student status and unlock an extra 20% discount on all deals.
            </p>

            <div className="mt-4 flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-border bg-secondary/50 px-4 py-8">
              {uploading ? (
                <>
                  <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <p className="text-sm font-medium text-foreground">Verifying...</p>
                </>
              ) : (
                <>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Camera className="h-6 w-6 text-primary" />
                  </div>
                  <p className="text-sm font-medium text-foreground">Upload Student Card (KTM)</p>
                  <p className="text-center text-xs text-muted-foreground">
                    Take a photo or upload from gallery. Make sure your name and institution are clearly visible.
                  </p>
                </>
              )}
            </div>

            <div className="mt-4 flex gap-3">
              <button
                onClick={() => setShowVerifyModal(false)}
                className="flex-1 rounded-xl bg-secondary py-3 text-sm font-medium text-secondary-foreground"
              >
                Cancel
              </button>
              <button
                onClick={handleVerify}
                disabled={uploading}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50"
              >
                <Upload className="h-4 w-4" />
                {uploading ? "Verifying..." : "Upload & Verify"}
              </button>
            </div>

            <div className="mt-3 rounded-lg bg-secondary/60 px-3 py-2">
              <p className="text-center text-[11px] text-muted-foreground">
                Your card photo is only used for verification and will not be stored permanently.
              </p>
            </div>
          </div>
        </div>
      )}

      {avatarCropFile ? (
        <AvatarCropModal
          file={avatarCropFile}
          open={Boolean(avatarCropFile)}
          onCancel={() => setAvatarCropFile(null)}
          onConfirm={async (croppedFile) => {
            await handleAvatarUpload(croppedFile)
            setAvatarCropFile(null)
          }}
        />
      ) : null}

      <AlertDialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure want to log out?</AlertDialogTitle>
            <AlertDialogDescription>
              Kamu akan keluar dari akun ini dan perlu login lagi untuk kembali masuk.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                try {
                  try {
                    for (let i = localStorage.length - 1; i >= 0; i--) {
                      const key = localStorage.key(i)
                      if (!key) continue
                      if (key === "user" || key === "isVerified" || key.startsWith("claimed:") || key.startsWith("otp:")) {
                        localStorage.removeItem(key)
                      }
                    }
                    localStorage.removeItem("rememberMe")
                    sessionStorage.removeItem("user")
                  } catch {
                    // ignore
                  }

                  setUser(null)
                  setVerified(false)
                  router.push("/auth/login")
                } catch {
                  // ignore
                }
              }}
            >
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
