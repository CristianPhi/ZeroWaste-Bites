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
  User,
  Upload,
  X,
} from "lucide-react"
import Link from "next/link"
import { useStudent } from "@/lib/student-context"
import { dealPosts } from "@/lib/data"
import { useEffect } from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { AppLogo } from "@/components/app-logo"

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

  const router = useRouter()

  const [claimedCount, setClaimedCount] = useState(0)
  const [moneySaved, setMoneySaved] = useState(0)
  const [foodRescuedKg, setFoodRescuedKg] = useState(0)

  useEffect(() => {
    // compute stats from localStorage claimed keys
    if (typeof window === "undefined") return
    try {
      let claimedIds: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (!key) continue
        if (key.startsWith("claimed:")) claimedIds.push(key.replace("claimed:", ""))
      }
      if (claimedIds.length === 0) {
        setClaimedCount(0)
        setMoneySaved(0)
        setFoodRescuedKg(0)
        return
      }

      let money = 0
      let kg = 0
      for (const id of claimedIds) {
        const deal = dealPosts.find((d) => d.id === id)
        if (!deal) continue
        // money saved = original - discounted (assume 1 unit claimed)
        money += Math.max(0, deal.originalPrice - deal.discountedPrice)
        // approximate 0.5 kg per claimed item times quantity
        kg += (deal.quantity ?? 1) * 0.5
      }

      setClaimedCount(claimedIds.length)
      setMoneySaved(money)
      setFoodRescuedKg(Number(kg.toFixed(1)))
    } catch {
      setClaimedCount(0)
      setMoneySaved(0)
      setFoodRescuedKg(0)
    }
  }, [user])

  const handleVerify = () => {
    setUploading(true)
    // Simulate upload & verification
    setTimeout(() => {
      setUploading(false)
      setVerified(true)
      setShowVerifyModal(false)
    }, 2000)
  }

  return (
    <div className="flex flex-col gap-5 pb-4">
      <header>
        <Link href="/" aria-label="Go to Feed">
          <AppLogo alt="ZeroWaste Bites" className="h-16 w-auto" priority />
        </Link>
      </header>

      {/* Profile Header */}
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <User className="h-7 w-7 text-primary" />
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

      {/* Student Verification Card */}
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

      {/* Impact stats */}
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
            <div className="mt-3 flex justify-center">
              <button
                onClick={() => {
                  try {
                    for (let i = localStorage.length - 1; i >= 0; i--) {
                      const key = localStorage.key(i)
                      if (!key) continue
                      if (key.startsWith("claimed:")) localStorage.removeItem(key)
                    }
                  } catch {}
                  setClaimedCount(0)
                  setMoneySaved(0)
                  setFoodRescuedKg(0)
                }}
                className="text-xs text-muted-foreground underline"
              >
                Reset my stats
              </button>
            </div>
          </div>
      </div>

      {/* Menu */}
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

      {/* Logout */}
      <button
        onClick={async () => {
          try {
            // call dev API to clear server-side JSON DB (dev only)
            try {
              await fetch('/api/dev/clear-db', { method: 'POST' })
            } catch {
              // ignore network errors in dev
            }

            // clear client-side stored user/session
            try {
              // remove keys created by app
              for (let i = localStorage.length - 1; i >= 0; i--) {
                const key = localStorage.key(i)
                if (!key) continue
                if (key === 'user' || key === 'isVerified' || key.startsWith('claimed:') || key.startsWith('otp:')) {
                  localStorage.removeItem(key)
                }
              }
              localStorage.removeItem('rememberMe')
              sessionStorage.removeItem('user')
            } catch {
              // ignore
            }

            setUser(null)
            setVerified(false)
            // redirect to login
            router.push('/auth/login')
          } catch {
            // ignore
          }
        }}
        className="flex items-center justify-center gap-2 rounded-xl bg-destructive/10 py-3 text-sm font-medium text-destructive transition-colors hover:bg-destructive/20"
      >
        <LogOut className="h-4 w-4" />
        Sign Out
      </button>

      {/* Student Verification Modal */}
      {showVerifyModal && (
        <div className="fixed inset-0 z-60 flex items-end justify-center bg-foreground/40 backdrop-blur-sm">
          <div className="mx-auto w-full max-w-md animate-in slide-in-from-bottom rounded-t-2xl bg-card p-6">
            <div className="flex items-center justify-between mb-4">
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
                  <p className="text-sm font-medium text-foreground">
                    Upload Student Card (KTM)
                  </p>
                  <p className="text-xs text-muted-foreground text-center">
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
              <p className="text-[11px] text-muted-foreground text-center">
                Your card photo is only used for verification and will not be stored permanently.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
