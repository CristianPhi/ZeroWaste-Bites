"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { dealPosts, type DealPost } from "@/lib/data"
import { DealPostCard } from "@/components/deal-post-card"
import { useStudent } from "@/lib/student-context"
import { getFavorites, removeFavorite } from "@/lib/favorites"
import { AppLogo } from "@/components/app-logo"

export default function SavedDealsPage() {
  const [savedIds, setSavedIds] = useState<string[]>([])
  const { user } = useStudent()

  useEffect(() => {
    if (typeof window === "undefined") return
    ;(async () => {
      try {
        if (user && user.email) {
          const fav = await getFavorites(user.email)
          setSavedIds(fav.savedDeals || [])
          return
        }
        const ids: string[] = []
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (!key) continue
          if (key.startsWith("saved:")) ids.push(key.replace("saved:", ""))
        }
        setSavedIds(ids)
      } catch {
        setSavedIds([])
      }
    })()
  }, [user])

  const remove = async (id: string) => {
    try {
      if (user && user.email) {
        await removeFavorite(user.email, "deal", id)
        setSavedIds((s) => s.filter((x) => x !== id))
        return
      }
      localStorage.removeItem(`saved:${id}`)
      setSavedIds((s) => s.filter((x) => x !== id))
    } catch {}
  }

  const savedDeals: DealPost[] = savedIds
    .map((id) => dealPosts.find((d) => d.id === id))
    .filter((deal): deal is DealPost => Boolean(deal))

  return (
    <main className="w-full px-4 py-8">
      <header className="mb-4">
        <Link href="/" aria-label="Go to Feed">
          <AppLogo alt="ZeroWaste Bites" className="h-16 w-auto" priority />
        </Link>
      </header>
      {savedDeals.length === 0 ? (
        <div className="rounded-lg border p-6 text-center">
          <p className="mb-3 text-sm text-muted-foreground">You haven't saved any deals yet.</p>
          <Link href="/" className="text-primary underline">Browse deals</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
          {savedDeals.map((deal) => (
            <div key={deal.id} className="rounded-xl ring-1 ring-border/50">
              <DealPostCard post={deal} />
              <div className="flex items-center justify-end px-4 py-2">
                <button onClick={() => remove(deal.id)} className="text-sm text-destructive underline">Remove</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
