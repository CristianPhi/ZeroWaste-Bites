"use client"

import Image from "next/image"
import Link from "next/link"
import { Clock, GraduationCap, Heart, MapPin, ShieldCheck } from "lucide-react"
import { type DealPost, formatPrice } from "@/lib/data"
import { useStudent, getStudentPrice } from "@/lib/student-context"
import { useState, useEffect } from "react"
import { getFavorites, addFavorite, removeFavorite } from "@/lib/favorites"

export function DealPostCard({ post }: { post: DealPost }) {
  const [liked, setLiked] = useState(false)
  const { isVerified } = useStudent()
  const studentPrice = getStudentPrice(post.discountedPrice)
  const totalStudentDiscount = Math.round(
    ((post.originalPrice - studentPrice) / post.originalPrice) * 100
  )

  const handleLike = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    // toggle and persist
    void (async () => {
      try {
        const stored = localStorage.getItem("user")
        const user = stored ? JSON.parse(stored) : null
        if (user && user.email) {
          if (!liked) {
            await addFavorite(user.email, "deal", post.id)
            setLiked(true)
          } else {
            await removeFavorite(user.email, "deal", post.id)
            setLiked(false)
          }
        } else {
          // fallback to localStorage for anonymous users
          if (!liked) localStorage.setItem(`saved:${post.id}`, "true")
          else localStorage.removeItem(`saved:${post.id}`)
          setLiked(!liked)
        }
      } catch {
        setLiked(!liked)
      }
    })()
  }

  useEffect(() => {
    // determine initial liked state from server DB or localStorage
    (async () => {
      try {
        const stored = localStorage.getItem("user")
        const user = stored ? JSON.parse(stored) : null
        if (user && user.email) {
          const fav = await getFavorites(user.email)
          setLiked(fav.savedDeals.includes(post.id))
        } else {
          setLiked(localStorage.getItem(`saved:${post.id}`) === "true")
        }
      } catch {
        setLiked(false)
      }
    })()
  }, [post.id])

  return (
    <Link href={`/deal/${post.id}`} className="block bg-card">
      {/* Compact store header */}
      <div className="flex items-center gap-2 px-4 py-2">
        <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full ring-1 ring-primary/20">
          <Image
            src={post.store.avatar}
            alt={post.store.name}
            fill
            className="object-cover"
            sizes="28px"
          />
        </div>
        <div className="flex items-center gap-1 flex-1 min-w-0">
          <span className="truncate text-xs font-semibold text-foreground">
            {post.store.name}
          </span>
          {post.store.verified && (
            <ShieldCheck className="h-3 w-3 shrink-0 text-primary" />
          )}
          <span className="text-[10px] text-muted-foreground">{post.postedAgo}</span>
        </div>
        <div className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
          {isVerified ? `-${totalStudentDiscount}%` : `-${post.discountPercent}%`}
        </div>
      </div>

      {/* Compact food image */}
      <div className="relative aspect-video w-full overflow-hidden">
        <Image
          src={post.image}
          alt={post.itemName}
          fill
          className="object-cover"
          sizes="(max-width: 448px) 100vw, 448px"
        />
        {/* Expiry pill */}
        <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-foreground/70 px-2 py-1 backdrop-blur-sm">
          <Clock className="h-2.5 w-2.5 text-card" />
          <span className="text-[10px] font-medium text-card">{post.expiresAt}</span>
        </div>
        {/* Qty + distance */}
        <div className="absolute right-2 top-2 flex flex-col gap-1">
          <div className="rounded-full bg-card/90 px-2 py-0.5 text-center backdrop-blur-sm">
            <span className="text-[10px] font-semibold text-foreground">{post.quantity} left</span>
          </div>
        </div>
        {/* Like button */}
        <button
          onClick={handleLike}
          className="absolute left-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-card/80 backdrop-blur-sm transition-colors"
          aria-label={liked ? "Unlike this deal" : "Like this deal"}
        >
          <Heart
            className={`h-3.5 w-3.5 ${liked ? "fill-primary text-primary" : "text-foreground"}`}
          />
        </button>

        {/* Student badge overlay */}
        {isVerified && (
          <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-accent px-2 py-1 backdrop-blur-sm">
            <GraduationCap className="h-2.5 w-2.5 text-accent-foreground" />
            <span className="text-[10px] font-bold text-accent-foreground">+20% off</span>
          </div>
        )}
      </div>

      {/* Compact content */}
      <div className="px-4 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <h3 className="truncate text-sm font-semibold text-foreground">{post.itemName}</h3>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground shrink-0">
            <MapPin className="h-2.5 w-2.5" />
            <span>{post.store.distance}</span>
          </div>
        </div>

        {/* Price row */}
        <div className="mt-1 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground line-through">
              {formatPrice(post.originalPrice)}
            </span>
            {isVerified ? (
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-muted-foreground line-through">
                  {formatPrice(post.discountedPrice)}
                </span>
                <span className="text-sm font-bold text-primary">
                  {formatPrice(studentPrice)}
                </span>
              </div>
            ) : (
              <span className="text-sm font-bold text-primary">
                {formatPrice(post.discountedPrice)}
              </span>
            )}
          </div>
          <span className="text-[10px] text-muted-foreground">{post.claimed} claimed</span>
        </div>
      </div>
    </Link>
  )
}
