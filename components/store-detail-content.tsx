"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Clock, MapPin, ShieldCheck, Star } from "lucide-react"
import { type Store, type DealPost, type ApiDeal, apiDealToDealPost, formatPrice } from "@/lib/data"
import { DealPostCard } from "@/components/deal-post-card"
import { AppLogo } from "@/components/app-logo"
import { useEffect, useState } from "react"
import { addFavorite, getFavorites, removeFavorite } from "@/lib/favorites"
import { useStudent } from "@/lib/student-context"

export function StoreDetailContent({ storeId }: { storeId: string }) {
  const { user } = useStudent()
  const [store, setStore] = useState<Store | null>(null)
  const [storeDeals, setStoreDeals] = useState<DealPost[]>([])
  const [loading, setLoading] = useState(true)
  const [isFavorite, setIsFavorite] = useState(false)

  useEffect(() => {
    if (!storeId) return
    fetch(`/api/stores/${encodeURIComponent(storeId)}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then((data) => {
        if (data.store) setStore(data.store as Store)
        if (data.deals) setStoreDeals((data.deals as ApiDeal[]).map(apiDealToDealPost))
        else setStoreDeals([])
      })
      .catch((err) => {
        console.error("[v0] Failed to load store:", err)
        setStore(null)
        setStoreDeals([])
      })
      .finally(() => setLoading(false))
  }, [storeId])

  useEffect(() => {
    if (!store) return
    ;(async () => {
      try {
        if (user?.email) {
          const fav = await getFavorites(user.email)
          setIsFavorite((fav.favoriteStores || []).includes(store.id))
          return
        }

        setIsFavorite(localStorage.getItem(`favorite:${store.id}`) === "true")
      } catch {
        setIsFavorite(false)
      }
    })()
  }, [store?.id, user?.email])

  const toggleFavorite = async () => {
    if (!store) return
    try {
      if (user?.email) {
        if (isFavorite) await removeFavorite(user.email, "store", store.id)
        else await addFavorite(user.email, "store", store.id)
      } else {
        if (isFavorite) localStorage.removeItem(`favorite:${store.id}`)
        else localStorage.setItem(`favorite:${store.id}`, "true")
      }
      setIsFavorite((v) => !v)
    } catch {
      // ignore
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground text-sm">Loading store...</p>
      </div>
    )
  }

  if (!store) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Store not found</p>
      </div>
    )
  }

  const totalSaved = storeDeals.reduce(
    (acc, p) => acc + (p.originalPrice - p.discountedPrice) * p.claimed,
    0
  )

  return (
    <div className="flex flex-col pb-24">
      {/* Header */}
      <div className="relative bg-primary/5 px-4 pb-6 pt-4">
        <div className="mb-3">
          <Link href="/" aria-label="Go to Feed">
            <AppLogo alt="ZeroWaste Bites" className="h-16 w-auto" priority />
          </Link>
        </div>

        <Link
          href="/"
          className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-card shadow-sm ring-1 ring-border/50 transition-colors hover:bg-secondary"
          aria-label="Go back"
        >
          <ArrowLeft className="h-4 w-4 text-foreground" />
        </Link>

        <div className="flex items-center gap-4">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl ring-2 ring-primary/20">
            <Image
              src={store.avatar}
              alt={store.name}
              fill
              className="object-cover"
              sizes="64px"
            />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-1.5">
              <h1 className="text-lg font-bold text-foreground">{store.name}</h1>
              {store.verified && (
                <ShieldCheck className="h-4 w-4 text-primary" />
              )}
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">{store.address}</p>
            <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-accent text-accent" />
                {store.rating}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {store.distance}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                Closes {store.closingTime}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={toggleFavorite}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-card shadow-sm ring-1 ring-border/50"
            aria-label={isFavorite ? "Remove store from favorites" : "Add store to favorites"}
          >
            <Star className={`h-4 w-4 ${isFavorite ? "fill-primary text-primary" : "text-muted-foreground"}`} />
          </button>
        </div>

        {/* Stats row */}
        <div className="mt-5 grid grid-cols-3 gap-3">
          <div className="flex flex-col items-center rounded-xl bg-card py-3 shadow-sm ring-1 ring-border/50">
            <span className="text-base font-bold text-foreground">{storeDeals.length}</span>
            <span className="mt-0.5 text-[10px] text-muted-foreground">Active deals</span>
          </div>
          <div className="flex flex-col items-center rounded-xl bg-card py-3 shadow-sm ring-1 ring-border/50">
            <span className="text-base font-bold text-foreground">
              {storeDeals.reduce((a, p) => a + p.claimed, 0)}
            </span>
            <span className="mt-0.5 text-[10px] text-muted-foreground">Claimed</span>
          </div>
          <div className="flex flex-col items-center rounded-xl bg-card py-3 shadow-sm ring-1 ring-border/50">
            <span className="text-base font-bold text-primary">
              {formatPrice(totalSaved)}
            </span>
            <span className="mt-0.5 text-[10px] text-muted-foreground">Saved</span>
          </div>
        </div>
      </div>

      {/* Store's posts */}
      <div className="mt-4">
        <h2 className="px-4 text-sm font-bold text-foreground">
          Active Deals ({storeDeals.length})
        </h2>
        <div className="mt-3 flex flex-col gap-2">
          {storeDeals.map((post) => (
            <DealPostCard key={post.id} post={post} />
          ))}
        </div>
        {storeDeals.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">
            No active deals right now
          </p>
        )}
      </div>
    </div>
  )
}
