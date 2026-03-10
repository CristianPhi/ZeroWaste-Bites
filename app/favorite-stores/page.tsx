"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { stores } from "@/lib/data"
import { useStudent } from "@/lib/student-context"
import { getFavorites, removeFavorite } from "@/lib/favorites"
import { AppLogo } from "@/components/app-logo"

export default function FavoriteStoresPage() {
  const [favIds, setFavIds] = useState<string[]>([])
  const [uploadedStoreMap, setUploadedStoreMap] = useState<Record<string, any>>({})
  const { user } = useStudent()

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch("/api/deals")
        if (!res.ok) return
        const data = await res.json()
        const map: Record<string, any> = {}
        if (Array.isArray(data.deals)) {
          for (const d of data.deals) {
            const key = `store-${String(d.ownerEmail || "unknown")}`
            if (!map[key]) {
              map[key] = {
                id: key,
                name: String(d.storeName || d.ownerName || "Store Owner"),
                avatar: String(d.storeAvatar || "/images/store-1.jpg"),
                address: "Uploaded by store owner",
                rating: 4.7,
              }
            }
          }
        }
        setUploadedStoreMap(map)
      } catch {
        setUploadedStoreMap({})
      }
    })()
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    ;(async () => {
      try {
        if (user && user.email) {
          const fav = await getFavorites(user.email)
          setFavIds(fav.favoriteStores || [])
          return
        }
        const ids: string[] = []
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (!key) continue
          if (key.startsWith("favorite:")) ids.push(key.replace("favorite:", ""))
        }
        setFavIds(ids)
      } catch {
        setFavIds([])
      }
    })()
  }, [user])

  const remove = async (id: string) => {
    try {
      if (user && user.email) {
        await removeFavorite(user.email, "store", id)
        setFavIds((s) => s.filter((x) => x !== id))
        return
      }
      localStorage.removeItem(`favorite:${id}`)
      setFavIds((s) => s.filter((x) => x !== id))
    } catch {}
  }

  const staticMap = Object.fromEntries(stores.map((s) => [s.id, s]))
  const allMap = { ...uploadedStoreMap, ...staticMap }
  const favStores = favIds.map((id) => allMap[id]).filter(Boolean)

  return (
    <main className="w-full px-4 py-8">
      <header className="mb-4">
        <Link href="/" aria-label="Go to Feed">
          <AppLogo alt="ZeroWaste Bites" className="h-16 w-auto" priority />
        </Link>
      </header>
      {favStores.length === 0 ? (
        <div className="rounded-lg border p-6 text-center">
          <p className="mb-3 text-sm text-muted-foreground">You haven't favorited any stores yet.</p>
          <Link href="/" className="text-primary underline">Browse stores</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
          {favStores.map((store: any) => (
            <div key={store.id} className="flex items-center gap-3 rounded-lg border p-3">
              <img src={store.avatar} alt={store.name} className="h-12 w-12 rounded-md object-cover" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">{store.name}</h3>
                  <div className="text-sm text-muted-foreground">{store.rating} ★</div>
                </div>
                <p className="text-xs text-muted-foreground">{store.address}</p>
                <div className="mt-2 flex items-center gap-2">
                  <button onClick={() => remove(store.id)} className="text-sm text-destructive underline">Remove</button>
                  <Link href={`/store/${encodeURIComponent(store.id)}`} className="ml-auto text-sm text-primary underline">View</Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
