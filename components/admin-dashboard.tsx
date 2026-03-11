"use client"

import {
  ArrowUpRight,
  Camera,
  Clock,
  Eye,
  Leaf,
  Package,
  Plus,
  TrendingUp,
  Upload,
  Users,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { formatPrice } from "@/lib/data"
import { AppLogo } from "@/components/app-logo"
import { useStudent } from "@/lib/student-context"

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
  const { user, setUser } = useStudent()
  const [storeName, setStoreName] = useState("")
  const [storeAddress, setStoreAddress] = useState("")
  const [storeClosingTime, setStoreClosingTime] = useState("22:00")
  const [itemName, setItemName] = useState("")
  const [photoUrl, setPhotoUrl] = useState("")
  const [selectedPhotoName, setSelectedPhotoName] = useState("")
  const [originalPriceInput, setOriginalPriceInput] = useState("")
  const [discountInput, setDiscountInput] = useState("50")
  const [quantityInput, setQuantityInput] = useState("1")
  const [category, setCategory] = useState("Meals")
  const [posts, setPosts] = useState<PostItem[]>([])
  const [uploading, setUploading] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)

  const foodPhotoInputRef = useRef<HTMLInputElement | null>(null)
  const avatarInputRef = useRef<HTMLInputElement | null>(null)

  const activePosts = posts.filter((p) => p.active)
  const totalClaimed = posts.reduce((a, p) => a + p.claimed, 0)
  const totalRevenue = posts.reduce((a, p) => a + p.discountedPrice * p.claimed, 0)

  useEffect(() => {
    if (!user?.email) return

    ;(async () => {
      try {
        const profileRes = await fetch(`/api/profile?email=${encodeURIComponent(user.email)}`)
        const profileData = await profileRes.json()
        if (profileRes.ok) {
          const storeOwner = profileData?.storeOwner || {}
          if (storeOwner?.storeName) setStoreName(String(storeOwner.storeName))
          if (storeOwner?.storeAddress) setStoreAddress(String(storeOwner.storeAddress))
          if (storeOwner?.storeClosingTime) setStoreClosingTime(String(storeOwner.storeClosingTime))

          if (profileData?.profile?.avatar) {
            setUser({
              id: String(profileData.profile.id || user.id),
              name: String(profileData.profile.name || user.name),
              email: String(profileData.profile.email || user.email),
              username: String(profileData.profile.username || user.username || ""),
              role: (profileData.profile.role || user.role) as "customer" | "store_owner",
              avatar: String(profileData.profile.avatar),
            })
          }
        }

        const res = await fetch(`/api/deals?ownerEmail=${encodeURIComponent(user.email)}`)
        const data = await res.json()
        if (!res.ok) return

        const nextPosts: PostItem[] = Array.isArray(data.deals)
          ? data.deals.map((p: any) => ({
              id: String(p.id),
              itemName: String(p.itemName || "Untitled"),
              image: String(p.image || "/images/store-1.jpg"),
              originalPrice: Number(p.originalPrice || 0),
              discountedPrice: Number(p.discountedPrice || 0),
              discountPercent: Number(p.discountPercent || 0),
              quantity: Number(p.quantity || 0),
              claimed: Number(p.claimed || 0),
              active: String(p.status || "active") === "active",
              expiresAt: String(p.expiresAt || "Tonight, 10 PM"),
            }))
          : []

        setPosts(nextPosts)
      } catch {
        // ignore
      }
    })()
  }, [user?.email, user?.id, user?.name, user?.role, user?.username, setUser])

  const uploadLocalImage = async (file: File) => {
    const fd = new FormData()
    fd.append("file", file)

    const res = await fetch("/api/upload", {
      method: "POST",
      body: fd,
    })
    const data = await res.json()
    if (!res.ok || !data?.url) throw new Error(data?.error || "Upload gagal")
    return String(data.url)
  }

  const handleFoodPhotoSelect = async (file: File) => {
    setUploading(true)
    try {
      const url = await uploadLocalImage(file)
      setPhotoUrl(url)
      setSelectedPhotoName(file.name)
    } finally {
      setUploading(false)
    }
  }

  const handleAvatarSelect = async (file: File) => {
    if (!user?.email) return
    setAvatarUploading(true)
    try {
      const avatarUrl = await uploadLocalImage(file)
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          avatar: avatarUrl,
          storeAvatar: avatarUrl,
        }),
      })
      const data = await res.json()
      if (!res.ok) return

      if (data?.profile) {
        setUser({
          id: String(data.profile.id || user.id),
          name: String(data.profile.name || user.name),
          email: String(data.profile.email || user.email),
          username: String(data.profile.username || user.username || ""),
          role: (data.profile.role || user.role) as "customer" | "store_owner",
          avatar: String(data.profile.avatar || avatarUrl),
        })
      }
    } finally {
      setAvatarUploading(false)
    }
  }

  const saveStoreProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.email) return

    setSavingProfile(true)
    try {
      await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          storeName,
          storeAddress,
          storeClosingTime,
        }),
      })
    } finally {
      setSavingProfile(false)
    }
  }

  const handleUploadDeal = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user?.email) return

    const originalPrice = Number(originalPriceInput)
    const discountPercent = Math.max(1, Math.min(95, Number(discountInput)))
    const quantity = Math.max(1, Number(quantityInput))

    if (!itemName || !photoUrl || !originalPrice || !discountPercent || !quantity) return

    setUploading(true)
    try {
      const res = await fetch("/api/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerEmail: user.email,
          ownerName: user.name,
          ownerUsername: user.username,
          storeName: storeName.trim() || user.name,
          storeAvatar: user.avatar || "/images/store-1.jpg",
          storeAddress,
          storeClosingTime,
          itemName,
          image: photoUrl,
          originalPrice,
          discountPercent,
          quantity,
          category,
          expiresAt: `Today, ${storeClosingTime || "22:00"}`,
        }),
      })

      const data = await res.json()
      if (!res.ok || !data?.deal) return

      const created = data.deal
      const newPost: PostItem = {
        id: String(created.id),
        itemName: String(created.itemName),
        image: String(created.image),
        originalPrice: Number(created.originalPrice),
        discountedPrice: Number(created.discountedPrice),
        discountPercent: Number(created.discountPercent),
        quantity: Number(created.quantity),
        claimed: Number(created.claimed || 0),
        active: String(created.status || "active") === "active",
        expiresAt: String(created.expiresAt || `Today, ${storeClosingTime || "22:00"}`),
      }

      setPosts((prev) => [newPost, ...prev])
      setItemName("")
      setPhotoUrl("")
      setSelectedPhotoName("")
      setOriginalPriceInput("")
      setDiscountInput("50")
      setQuantityInput("1")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 pb-8">
      <header className="flex items-start justify-between">
        <div>
          <Link href="/" aria-label="Go to Feed">
            <AppLogo alt="ZeroWaste Bites" className="h-16 w-auto" priority />
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="flex items-center gap-1 rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground transition-colors hover:bg-secondary/80"
          >
            Buyer View
            <ArrowUpRight className="h-3 w-3" />
          </Link>
          <Link
            href="/admin/profile"
            className="flex items-center gap-1 rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground transition-colors hover:bg-secondary/80"
          >
            Profile
          </Link>
        </div>
      </header>

      <h1 className="-mt-1 text-center text-lg font-semibold tracking-tight text-foreground">Admin</h1>

      <form onSubmit={saveStoreProfile} className="rounded-xl bg-card p-4 shadow-sm ring-1 ring-border/50">
        <div className="mb-3 flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Store Profile</h2>
        </div>

        <div className="mb-3 flex items-center gap-3">
          <div className="relative h-14 w-14 overflow-hidden rounded-full bg-primary/10">
            {user?.avatar ? (
              <Image src={user.avatar} alt={user.name || "Store avatar"} fill className="object-cover" sizes="56px" />
            ) : (
              <Users className="m-auto h-full w-6 text-primary" />
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{user?.name || "Store Owner"}</p>
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={avatarUploading}
              className="mt-1 inline-flex items-center gap-1 text-xs text-primary"
            >
              <Camera className="h-3 w-3" />
              {avatarUploading ? "Uploading avatar..." : "Upload avatar"}
            </button>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0]
                if (!file) return
                await handleAvatarSelect(file)
                e.currentTarget.value = ""
              }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="text-xs text-muted-foreground">
            Store name
            <input
              type="text"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
              placeholder="Nama toko kamu"
            />
          </label>

          <label className="text-xs text-muted-foreground">
            Closing time
            <input
              type="time"
              value={storeClosingTime}
              onChange={(e) => setStoreClosingTime(e.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
            />
          </label>

          <label className="text-xs text-muted-foreground md:col-span-2">
            Store address
            <input
              type="text"
              value={storeAddress}
              onChange={(e) => setStoreAddress(e.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
              placeholder="Alamat toko"
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={savingProfile}
          className="mt-3 rounded-xl bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground"
        >
          {savingProfile ? "Saving..." : "Save Store Profile"}
        </button>
      </form>

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

          <label className="text-xs text-muted-foreground">
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

          <label className="text-xs text-muted-foreground md:col-span-2">
            Category
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
            >
              <option value="Meals">Meals</option>
              <option value="Bakery">Bakery</option>
              <option value="Snacks">Snacks</option>
              <option value="Drinks">Drinks</option>
            </select>
          </label>
        </div>

        <div className="mt-3 rounded-xl border border-dashed border-border p-3">
          <p className="text-xs text-muted-foreground">Food photo (upload from local)</p>
          <button
            type="button"
            onClick={() => foodPhotoInputRef.current?.click()}
            className="mt-2 inline-flex items-center gap-2 rounded-lg bg-secondary px-3 py-2 text-xs font-medium"
          >
            <Upload className="h-3.5 w-3.5" />
            {selectedPhotoName || "Choose photo"}
          </button>
          <input
            ref={foodPhotoInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0]
              if (!file) return
              await handleFoodPhotoSelect(file)
              e.currentTarget.value = ""
            }}
          />
          {photoUrl && (
            <div className="relative mt-3 h-28 w-full overflow-hidden rounded-lg">
              <Image src={photoUrl} alt="Food preview" fill className="object-cover" sizes="(max-width: 768px) 100vw, 300px" />
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={uploading || !photoUrl}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
        >
          <Plus className="h-4 w-4" />
          {uploading ? "Uploading..." : "Upload Deal"}
        </button>
      </form>

      <div>
        <h2 className="text-sm font-bold text-foreground">Your Deal Posts</h2>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          Riwayat post kamu ditampilkan berdasarkan akun owner yang sedang login.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          {posts.map((post) => (
            <div
              key={post.id}
              className={`rounded-xl bg-card p-3 shadow-sm ring-1 transition-all ${
                post.active ? "ring-primary/30" : "ring-border/50 opacity-60"
              }`}
            >
              <div className="flex gap-3">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg">
                  <Image src={post.image} alt={post.itemName} fill className="object-cover" sizes="64px" />
                </div>
                <div className="flex flex-1 flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">{post.itemName}</h3>
                    <p className="text-[11px] text-muted-foreground">
                      <span className="line-through">{formatPrice(post.originalPrice)}</span>{" "}
                      <span className="font-semibold text-primary">{formatPrice(post.discountedPrice)}</span>
                      <span className="ml-1 text-primary">({`-${post.discountPercent}%`})</span>
                    </p>
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
