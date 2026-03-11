"use client"

import { Bell, GraduationCap, Leaf, MapPin } from "lucide-react"
import { type DealPost, type ApiDeal, apiDealToDealPost } from "@/lib/data"
import { DealPostCard } from "@/components/deal-post-card"
import { useStudent } from "@/lib/student-context"
import { useState, useEffect } from "react"
import Link from "next/link"
import { AppLogo } from "@/components/app-logo"

const categories = [
  { label: "For You", value: "all" },
  { label: "Bakery", value: "Bakery" },
  { label: "Meals", value: "Meals" },
  { label: "Snacks", value: "Snacks" },
  { label: "Drinks", value: "Drinks" },
]

export function HomeContent() {
  const [active, setActive] = useState("all")
  const { isVerified } = useStudent()
  const [deals, setDeals] = useState<DealPost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchDeals() {
      try {
        const res = await fetch("/api/deals")
        if (!res.ok) return
        const data = await res.json()
        const mapped = (data.deals as ApiDeal[]).map(apiDealToDealPost)
        setDeals(mapped)
      } catch {
        // ignore
      } finally {
        setLoading(false)
      }
    }
    fetchDeals()
  }, [])

  const filtered =
    active === "all"
      ? deals
      : deals.filter((p) => p.category === active)

  return (
    <div className="flex flex-col">
      {/* Sticky header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md">
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <Link href="/" aria-label="Go to Feed">
            <AppLogo alt="ZeroWaste Bites" className="h-16 w-auto" priority />
          </Link>
          <div className="flex items-center gap-2">
            <button
              className="relative rounded-full bg-secondary p-2 text-foreground transition-colors hover:bg-secondary/80"
              aria-label="Notifications"
            >
              <Bell className="h-4.5 w-4.5" />
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-primary" />
            </button>
          </div>
        </div>

        {/* Category tabs */}
        <div className="flex items-center justify-between gap-3 px-4 pb-3 pt-1">
          <div className="flex flex-1 gap-1.5 overflow-x-auto scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setActive(cat.value)}
                className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
                  active === cat.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
          <div className="flex shrink-0 items-center gap-1 text-[11px] text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span>Jakarta Pusat</span>
          </div>
        </div>
      </header>

      {/* Banner */}
      {isVerified ? (
        <div className="mx-4 mt-1 mb-2 flex items-center gap-2.5 rounded-xl bg-accent/10 px-4 py-2.5">
          <GraduationCap className="h-4 w-4 shrink-0 text-accent-foreground" />
          <p className="text-xs leading-relaxed text-secondary-foreground">
            <span className="font-semibold text-accent-foreground">Student discount active</span> -- extra 20% off all deals
          </p>
        </div>
      ) : (
        <Link href="/profile" className="mx-4 mt-1 mb-2 flex items-center gap-2.5 rounded-xl bg-primary/10 px-4 py-2.5 transition-colors hover:bg-primary/15">
          <Leaf className="h-4 w-4 shrink-0 text-primary" />
          <p className="text-xs leading-relaxed text-secondary-foreground">
            <span className="font-semibold text-primary">156 meals</span> saved from waste today in your area
          </p>
        </Link>
      )}

      {/* Feed */}
      <div className="grid grid-cols-1 gap-2 pb-24 lg:grid-cols-2">
        {loading ? (
          <div className="flex flex-col items-center justify-center px-4 py-16 text-center lg:col-span-2">
            <Leaf className="mb-3 h-8 w-8 animate-pulse text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Loading deals...</p>
          </div>
        ) : filtered.length > 0 ? (
          filtered.map((post) => (
            <DealPostCard key={post.id} post={post} />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center px-4 py-16 text-center lg:col-span-2">
            <Leaf className="mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm font-medium text-muted-foreground">No deals in this category yet</p>
            <p className="mt-1 text-xs text-muted-foreground/70">Check back soon!</p>
          </div>
        )}
      </div>
    </div>
  )
}

