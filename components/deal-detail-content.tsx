"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Clock, GraduationCap, Heart, MapPin, Navigation, Share2, ShieldCheck, Star } from "lucide-react"
import { type DealPost, type ApiDeal, apiDealToDealPost, formatPrice } from "@/lib/data"
import { useStudent, getStudentPrice } from "@/lib/student-context"
import { isDealClaimed } from "@/lib/claims"
import { addFavorite, getFavorites, removeFavorite } from "@/lib/favorites"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { useState } from "react"
import { AppLogo } from "@/components/app-logo"

export function DealDetailContent({ dealId }: { dealId: string }) {
  const [post, setPost] = useState<DealPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [claimed, setClaimed] = useState(false)
  const [liked, setLiked] = useState(false)
  const [favoriteStore, setFavoriteStore] = useState(false)
  const { isVerified, user } = useStudent()

  const router = useRouter()

  useEffect(() => {
    if (!dealId) return
    fetch(`/api/deals?id=${encodeURIComponent(dealId)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.deal) setPost(apiDealToDealPost(data.deal as ApiDeal))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [dealId])

  useEffect(() => {
    try {
      setClaimed(isDealClaimed(dealId))
    } catch {
      // ignore
    }
  }, [dealId])

  useEffect(() => {
    ;(async () => {
      try {
        if (user?.email) {
          const fav = await getFavorites(user.email)
          setLiked((fav.savedDeals || []).includes(dealId))
          return
        }
        setLiked(localStorage.getItem(`saved:${dealId}`) === "true")
      } catch {
        setLiked(false)
      }
    })()
  }, [dealId, user?.email])

  useEffect(() => {
    ;(async () => {
      try {
        if (!post?.store?.id) {
          setFavoriteStore(false)
          return
        }

        if (user?.email) {
          const fav = await getFavorites(user.email)
          setFavoriteStore((fav.favoriteStores || []).includes(post.store.id))
          return
        }

        setFavoriteStore(localStorage.getItem(`favorite:${post.store.id}`) === "true")
      } catch {
        setFavoriteStore(false)
      }
    })()
  }, [post?.store?.id, user?.email])

  const toggleLike = async () => {
    try {
      if (user?.email) {
        if (!liked) {
          await addFavorite(user.email, "deal", dealId)
          setLiked(true)
        } else {
          await removeFavorite(user.email, "deal", dealId)
          setLiked(false)
        }
        return
      }

      if (!liked) localStorage.setItem(`saved:${dealId}`, "true")
      else localStorage.removeItem(`saved:${dealId}`)
      setLiked(!liked)
    } catch {
      setLiked(!liked)
    }
  }

  const toggleFavoriteStore = async () => {
    if (!post?.store?.id) return
    try {
      if (user?.email) {
        if (!favoriteStore) {
          await addFavorite(user.email, "store", post.store.id)
          setFavoriteStore(true)
        } else {
          await removeFavorite(user.email, "store", post.store.id)
          setFavoriteStore(false)
        }
        return
      }

      if (!favoriteStore) localStorage.setItem(`favorite:${post.store.id}`, "true")
      else localStorage.removeItem(`favorite:${post.store.id}`)
      setFavoriteStore(!favoriteStore)
    } catch {
      setFavoriteStore(!favoriteStore)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <p className="text-sm text-muted-foreground">Loading deal...</p>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <p className="text-muted-foreground">Deal not found</p>
      </div>
    )
  }

  const studentPrice = getStudentPrice(post.discountedPrice)
  const totalStudentDiscount = Math.round(
    ((post.originalPrice - studentPrice) / post.originalPrice) * 100
  )
  const finalPrice = isVerified ? studentPrice : post.discountedPrice
  const leftQuantity = Math.max(0, Number(post.quantity || 0) - Number(post.claimed || 0))

  const openDirections = () => {
    const query = String(post.store.address || post.store.name || "").trim()
    if (!query) return
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
    window.open(mapsUrl, "_blank", "noopener,noreferrer")
  }

  return (
    <div className="flex flex-col pb-28">
      <div className="px-4 pt-4">
        <Link href="/" aria-label="Go to Feed">
          <AppLogo alt="ZeroWaste Bites" className="h-16 w-auto" priority />
        </Link>
        <h1 className="mt-2 text-center text-lg font-semibold tracking-tight text-foreground">Deal</h1>
      </div>

      {/* Image */}
      <div className="relative aspect-4/3 w-full overflow-hidden">
        <Image
          src={post.image}
          alt={post.itemName}
          fill
          className="object-cover"
          sizes="(max-width: 448px) 100vw, 448px"
        />
        <div className="absolute inset-0 bg-linear-to-t from-foreground/40 via-transparent to-foreground/20" />
        {leftQuantity <= 0 ? (
          <div className="absolute inset-0 flex items-center justify-center bg-foreground/20">
            <span className="rounded-full bg-muted/90 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-foreground shadow-sm">
              Sold Out
            </span>
          </div>
        ) : null}
        <Link
          href="/"
          className="absolute left-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-card/80 backdrop-blur-sm transition-colors hover:bg-card"
          aria-label="Go back"
        >
          <ArrowLeft className="h-4 w-4 text-foreground" />
        </Link>
        <div className="absolute right-4 top-4 flex gap-2">
          <button
            onClick={toggleLike}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-card/80 backdrop-blur-sm transition-colors hover:bg-card"
            aria-label={liked ? "Unlike" : "Like"}
          >
            <Heart className={`h-4 w-4 ${liked ? "fill-primary text-primary" : "text-foreground"}`} />
          </button>
          <button
            className="flex h-9 w-9 items-center justify-center rounded-full bg-card/80 backdrop-blur-sm transition-colors hover:bg-card"
            aria-label="Share"
          >
            <Share2 className="h-4 w-4 text-foreground" />
          </button>
        </div>
        <div className="absolute bottom-4 left-4 rounded-full bg-primary px-3 py-1.5 text-sm font-bold text-primary-foreground">
          {isVerified ? `${totalStudentDiscount}% OFF` : `${post.discountPercent}% OFF`}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pt-5">
        {/* Item info */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-medium text-secondary-foreground">
              {post.category}
            </span>
            <h1 className="mt-2 text-xl font-bold text-balance text-foreground">{post.itemName}</h1>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs text-muted-foreground line-through">
              {formatPrice(post.originalPrice)}
            </p>
            {isVerified ? (
              <>
                <p className="text-xs text-muted-foreground line-through">
                  {formatPrice(post.discountedPrice)}
                </p>
                <p className="text-xl font-bold text-primary">
                  {formatPrice(studentPrice)}
                </p>
              </>
            ) : (
              <p className="text-xl font-bold text-primary">
                {formatPrice(post.discountedPrice)}
              </p>
            )}
          </div>
        </div>

        {/* Student discount banner */}
        {isVerified && (
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-accent/15 px-3 py-2.5">
            <GraduationCap className="h-4 w-4 shrink-0 text-accent-foreground" />
            <div>
              <p className="text-xs font-semibold text-accent-foreground">Student discount applied</p>
              <p className="text-[11px] text-muted-foreground">
                {post.discountPercent}% store discount + 20% student extra = {totalStudentDiscount}% total savings
              </p>
            </div>
          </div>
        )}

        {!isVerified && (
          <Link
            href="/profile"
            className="mt-3 flex items-center gap-2 rounded-xl bg-accent/10 px-3 py-2.5 transition-colors hover:bg-accent/20"
          >
            <GraduationCap className="h-4 w-4 shrink-0 text-accent-foreground" />
            <div className="flex-1">
              <p className="text-xs font-semibold text-accent-foreground">Student? Get extra 20% off</p>
              <p className="text-[11px] text-muted-foreground">
                Verify with your student card to pay only {formatPrice(studentPrice)}
              </p>
            </div>
          </Link>
        )}

        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {post.description}
        </p>

        {/* Info pills */}
        <div className="mt-4 flex flex-wrap gap-2">
          <div className="flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-2">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-secondary-foreground">
              Expires: {post.expiresAt}
            </span>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-2">
            <span className="text-xs font-semibold text-primary">{leftQuantity} left</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-2">
            <span className="text-xs text-secondary-foreground">{post.claimed} claimed</span>
          </div>
        </div>

        {/* Divider */}
        <div className="my-5 border-t border-border" />

        {/* Store info */}
        <div className="flex items-center gap-3">
          <Link href={`/store/${post.store.id}`} className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full ring-2 ring-primary/20">
            <Image
              src={post.store.avatar}
              alt={post.store.name}
              fill
              className="object-cover"
              sizes="48px"
            />
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-1.5">
              <Link href={`/store/${post.store.id}`} className="text-sm font-semibold text-foreground hover:underline">
                {post.store.name}
              </Link>
              {post.store.verified && (
                <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              )}
            </div>
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-0.5">
                <Star className="h-3 w-3 fill-accent text-accent" />
                {post.store.rating}
              </span>
              <span className="flex items-center gap-0.5">
                <MapPin className="h-3 w-3" />
                {post.store.distance}
              </span>
              <span>Closes at {post.store.closingTime}</span>
            </div>
          </div>
          <Link
            href={`/store/${post.store.id}`}
            className="rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground transition-colors hover:bg-secondary/80"
          >
            Visit
          </Link>
          <button
            onClick={toggleFavoriteStore}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-secondary-foreground transition-colors hover:bg-secondary/80"
            aria-label={favoriteStore ? "Remove store from favorites" : "Add store to favorites"}
            title={favoriteStore ? "Unfavorite store" : "Favorite store"}
          >
            <Star className={`h-4 w-4 ${favoriteStore ? "fill-primary text-primary" : "text-muted-foreground"}`} />
          </button>
        </div>

        {/* Address */}
        <div className="mt-3 flex items-start gap-2 rounded-xl bg-secondary/60 px-3 py-3">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <div>
            <p className="text-xs font-medium text-foreground">{post.store.address}</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Pickup before {post.store.closingTime}
            </p>
          </div>
        </div>
      </div>

      {/* Fixed bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-md items-center gap-3 px-4 py-3">
          <button
            onClick={openDirections}
            className="flex flex-1 items-center justify-center rounded-xl bg-secondary px-4 py-3 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80"
            aria-label="Get directions to store"
          >
            <Navigation className="mr-2 h-4 w-4" />
            Directions
          </button>
          {claimed ? (
            <div className="flex flex-1 flex-col items-center rounded-xl bg-primary/10 px-4 py-2.5">
              <span className="text-sm font-semibold text-primary">Claimed!</span>
              <span className="text-[10px] text-muted-foreground">
                Pick up before {post.store.closingTime}
              </span>
            </div>
          ) : leftQuantity <= 0 ? (
            <div className="flex flex-1 flex-col items-center rounded-xl bg-secondary px-4 py-2.5">
              <span className="text-sm font-semibold text-muted-foreground">Sold out</span>
              <span className="text-[10px] text-muted-foreground">No items left</span>
            </div>
          ) : (
            <button
              onClick={() => {
                // Track money saved before navigating to payment
                const moneySaved = post.originalPrice - post.discountedPrice
                if (user?.email && moneySaved > 0) {
                  fetch(`/api/saved-money`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      email: user.email,
                      dealId: post.id,
                      amountSaved: moneySaved,
                      storeName: post.store.name,
                      itemName: post.itemName,
                    }),
                  }).catch(() => {
                    // Silently fail - don't block payment flow
                  })
                }
                router.push(`/payments?dealId=${encodeURIComponent(post.id)}&amount=${finalPrice}`)
              }}
              className="flex flex-1 items-center justify-center rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Claim - {formatPrice(finalPrice)}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
