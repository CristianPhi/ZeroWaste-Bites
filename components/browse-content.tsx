"use client"

import { Search, SlidersHorizontal } from "lucide-react"
import { useState } from "react"
import { dealPosts, stores } from "@/lib/data"
import { DealPostCard } from "@/components/deal-post-card"
import Link from "next/link"
import Image from "next/image"
import { AppLogo } from "@/components/app-logo"

const categories = ["All", "Bakery", "Meals", "Snacks", "Drinks"]

export function BrowseContent() {
  const [query, setQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState("All")
  const [showStores, setShowStores] = useState(false)

  const filteredDeals = dealPosts.filter((post) => {
    const matchQuery =
      query === "" ||
      post.itemName.toLowerCase().includes(query.toLowerCase()) ||
      post.store.name.toLowerCase().includes(query.toLowerCase())
    const matchCategory =
      activeCategory === "All" || post.category === activeCategory
    return matchQuery && matchCategory
  })

  const filteredStores = stores.filter(
    (s) =>
      query === "" || s.name.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div className="flex flex-col pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 px-4 pt-4 pb-3 backdrop-blur-md">
        <div className="flex items-start justify-between">
          <Link href="/" aria-label="Go to Feed">
            <AppLogo alt="ZeroWaste Bites" className="h-16 w-auto" priority />
          </Link>
          <div className="w-9" />
        </div>
        <h1 className="mt-1 pb-1 text-center text-lg font-semibold tracking-tight text-foreground">Discover</h1>

        {/* Search */}
        <div className="mt-3 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search deals or stores..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-xl border border-input bg-card py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              aria-label="Search deals or stores"
            />
          </div>
          <button
            className="flex items-center justify-center rounded-xl border border-input bg-card px-3 transition-colors hover:bg-secondary"
            aria-label="Filters"
          >
            <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Tabs */}
        <div className="mt-3 flex gap-1 rounded-lg bg-secondary p-1">
          <button
            onClick={() => setShowStores(false)}
            className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-colors ${
              !showStores
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground"
            }`}
          >
            Deals
          </button>
          <button
            onClick={() => setShowStores(true)}
            className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-colors ${
              showStores
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground"
            }`}
          >
            Stores
          </button>
        </div>

        {/* Category filter (deals only) */}
        {!showStores && (
          <div className="mt-3 flex gap-1.5 overflow-x-auto scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                  activeCategory === cat
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-secondary-foreground ring-1 ring-border hover:bg-card/80"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Results */}
      {showStores ? (
        <div className="flex flex-col gap-3 px-4 pt-3">
          <p className="text-xs text-muted-foreground">
            {filteredStores.length} store{filteredStores.length !== 1 ? "s" : ""} found
          </p>
          {filteredStores.map((store) => (
            <Link
              key={store.id}
              href={`/store/${store.id}`}
              className="flex items-center gap-3 rounded-xl bg-card p-4 shadow-sm ring-1 ring-border/50 transition-all hover:shadow-md hover:ring-primary/20"
            >
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full ring-2 ring-primary/10">
                <Image
                  src={store.avatar}
                  alt={store.name}
                  fill
                  className="object-cover"
                  sizes="56px"
                />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-foreground">{store.name}</h3>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{store.address}</p>
                <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span>{store.distance}</span>
                  <span>Closes {store.closingTime}</span>
                </div>
              </div>
              <div className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
                {dealPosts.filter((p) => p.store.id === store.id).length} deals
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="pt-2">
          <p className="px-4 text-xs text-muted-foreground">
            {filteredDeals.length} deal{filteredDeals.length !== 1 ? "s" : ""} found
          </p>
          {filteredDeals.length > 0 ? (
            <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
              {filteredDeals.map((post) => (
                <DealPostCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
              <Search className="mb-3 h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm font-medium text-muted-foreground">No deals found</p>
              <p className="mt-1 text-xs text-muted-foreground/70">
                Try a different search or category
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
