"use client"

import {
  ArrowUpRight,
  Clock,
  Eye,
  Leaf,
  Package,
  Percent,
  Plus,
  Power,
  TrendingUp,
  Users,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { dealPosts, formatPrice } from "@/lib/data"
import { AppLogo } from "@/components/app-logo"

const storePosts = dealPosts.filter((f) => f.store.id === "holland-bakery")

interface PostItem {
  id: string
  itemName: string
  image: string
  originalPrice: number
  discountedPrice: number
  discountPercent: number
  quantity: number
  claimed: number
  active: boolean
  expiresAt: string
}

export function AdminDashboard() {
  const [itemName, setItemName] = useState("")
  const [photoUrl, setPhotoUrl] = useState("")
  const [originalPriceInput, setOriginalPriceInput] = useState("")
  const [discountInput, setDiscountInput] = useState("50")
  const [quantityInput, setQuantityInput] = useState("1")
  const [posts, setPosts] = useState<PostItem[]>(
    storePosts.map((p) => ({
      id: p.id,
      itemName: p.itemName,
      image: p.image,
      originalPrice: p.originalPrice,
      discountedPrice: p.discountedPrice,
      discountPercent: p.discountPercent,
      quantity: p.quantity,
      claimed: p.claimed,
      active: true,
      expiresAt: p.expiresAt,
    }))
  )

  const togglePost = (id: string) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, active: !p.active } : p))
    )
  }

  const activePosts = posts.filter((p) => p.active)
  const totalClaimed = posts.reduce((a, p) => a + p.claimed, 0)
  const totalRevenue = posts.reduce(
    (a, p) => a + p.discountedPrice * p.claimed,
    0
  )

  const handleUploadDeal = (e: React.FormEvent) => {
    e.preventDefault()

    const originalPrice = Number(originalPriceInput)
    const discountPercent = Math.max(1, Math.min(95, Number(discountInput)))
    const quantity = Math.max(1, Number(quantityInput))

    if (!itemName || !photoUrl || !originalPrice || !discountPercent || !quantity) return

    const discountedPrice = Math.max(1000, Math.round(originalPrice * (1 - discountPercent / 100)))

    const newPost: PostItem = {
      id: `custom-${Date.now()}`,
      itemName,
      image: photoUrl,
      originalPrice,
      discountedPrice,
      discountPercent,
      quantity,
      claimed: 0,
      active: true,
      expiresAt: "Tonight, 10 PM",
    }

    setPosts((prev) => [newPost, ...prev])
    setItemName("")
    setPhotoUrl("")
    setOriginalPriceInput("")
    setDiscountInput("50")
    setQuantityInput("1")
  }

  return (
    <div className="flex flex-col gap-6 pb-8">
      {/* Header */}
      <header className="flex items-start justify-between">
        <div>
          <Link href="/" aria-label="Go to Feed">
            <AppLogo alt="ZeroWaste Bites" className="h-16 w-auto" priority />
          </Link>
        </div>
        <Link
          href="/"
          className="flex items-center gap-1 rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground transition-colors hover:bg-secondary/80"
        >
          Buyer View
          <ArrowUpRight className="h-3 w-3" />
        </Link>
      </header>
      <h1 className="-mt-1 text-center text-lg font-semibold tracking-tight text-foreground">Admin</h1>
      <div>
        <p className="text-center text-[11px] font-medium uppercase tracking-wide text-primary">Seller Dashboard</p>
        <p className="mt-0.5 text-center text-lg font-bold text-foreground">Holland Bakery</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        {[
          {
            label: "Active Posts",
            value: activePosts.length.toString(),
            icon: Package,
            color: "text-primary",
            bgColor: "bg-primary/10",
          },
          {
            label: "Total Claimed",
            value: totalClaimed.toString(),
            icon: Users,
            color: "text-accent-foreground",
            bgColor: "bg-accent/10",
          },
          {
            label: "Revenue",
            value: formatPrice(totalRevenue),
            icon: TrendingUp,
            color: "text-primary",
            bgColor: "bg-primary/10",
          },
          {
            label: "Food Saved",
            value: `${totalClaimed} meals`,
            icon: Leaf,
            color: "text-primary",
            bgColor: "bg-primary/10",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="flex items-start gap-3 rounded-xl bg-card p-3.5 shadow-sm ring-1 ring-border/50"
          >
            <div className={`rounded-lg ${stat.bgColor} p-2`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">{stat.label}</p>
              <p className="mt-0.5 text-sm font-bold text-foreground">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Upload deal */}
      <form onSubmit={handleUploadDeal} className="rounded-xl bg-card p-4 shadow-sm ring-1 ring-border/50">
        <div className="mb-3 flex items-center gap-2">
          <Plus className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Upload New Deal</h2>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="text-xs text-muted-foreground">
            Food name
            <input
              type="text"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
              placeholder="Contoh: Roti Tuna"
              required
            />
          </label>

          <label className="text-xs text-muted-foreground">
            Photo URL
            <input
              type="url"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
              placeholder="https://..."
              required
            />
          </label>

          <label className="text-xs text-muted-foreground">
            Original price (IDR)
            <input
              type="number"
              min={1000}
              value={originalPriceInput}
              onChange={(e) => setOriginalPriceInput(e.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
              placeholder="15000"
              required
            />
          </label>

          <label className="text-xs text-muted-foreground">
            Discount (%)
            <input
              type="number"
              min={1}
              max={95}
              value={discountInput}
              onChange={(e) => setDiscountInput(e.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
              required
            />
          </label>

          <label className="text-xs text-muted-foreground md:col-span-2">
            Quantity available
            <input
              type="number"
              min={1}
              value={quantityInput}
              onChange={(e) => setQuantityInput(e.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
              required
            />
          </label>
        </div>

        <button
          type="submit"
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Upload Deal
        </button>
      </form>

      {/* Your posts */}
      <div>
        <h2 className="text-sm font-bold text-foreground">Your Deal Posts</h2>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          Manage your active and expired deal listings
        </p>

        <div className="mt-4 flex flex-col gap-3">
          {posts.map((post) => (
            <div
              key={post.id}
              className={`rounded-xl bg-card p-3 shadow-sm ring-1 transition-all ${
                post.active ? "ring-primary/30" : "ring-border/50 opacity-60"
              }`}
            >
              <div className="flex gap-3">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg">
                  <Image
                    src={post.image}
                    alt={post.itemName}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </div>
                <div className="flex flex-1 flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">
                        {post.itemName}
                      </h3>
                      <p className="text-[11px] text-muted-foreground">
                        <span className="line-through">
                          {formatPrice(post.originalPrice)}
                        </span>
                        {" "}
                        <span className="font-semibold text-primary">
                          {formatPrice(post.discountedPrice)}
                        </span>
                        <span className="ml-1 text-primary">
                          ({`-${post.discountPercent}%`})
                        </span>
                      </p>
                    </div>
                    <button
                      onClick={() => togglePost(post.id)}
                      className={`rounded-full p-1.5 transition-colors ${
                        post.active
                          ? "bg-primary/10 text-primary"
                          : "bg-secondary text-muted-foreground"
                      }`}
                      aria-label={
                        post.active
                          ? `Deactivate ${post.itemName}`
                          : `Activate ${post.itemName}`
                      }
                    >
                      <Power className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {post.quantity} left
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {post.claimed} claimed
                      </span>
                    </div>
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {post.expiresAt}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
