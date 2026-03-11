"use client"

import Image from "next/image"
import Link from "next/link"
import { Clock, MapPin, Navigation, Package } from "lucide-react"
import { AppLogo } from "@/components/app-logo"
import { useEffect, useState } from "react"
import { type ApiOrder, formatPrice } from "@/lib/data"
import { useStudent } from "@/lib/student-context"

export function OrdersContent() {
  const { user } = useStudent()
  const [orders, setOrders] = useState<ApiOrder[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.email) {
      setLoading(false)
      return
    }
    fetch(`/api/orders?email=${encodeURIComponent(user.email)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.orders) setOrders(data.orders as ApiOrder[])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user?.email])

  const active = orders.filter((d) => d.status === "Pickup Ready")
  const past = orders.filter((d) => d.status === "Completed" || d.status === "Cancelled")

  return (
    <div className="flex flex-col gap-5 pb-4">
      <header>
        <Link href="/" aria-label="Go to Feed">
          <AppLogo alt="ZeroWaste Bites" className="h-16 w-auto" priority />
        </Link>
        <h1 className="mt-2 text-center text-lg font-semibold tracking-tight text-foreground">Claims</h1>
        <p className="mt-1 text-center text-xs text-muted-foreground">
          Deals you have claimed for pickup
        </p>
      </header>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <p className="text-sm text-muted-foreground">Loading claims...</p>
        </div>
      )}

      {/* Active */}
      {!loading && active.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold text-primary uppercase tracking-wide">
            Ready for Pickup
          </h2>
          <div className="mt-2.5 grid grid-cols-1 gap-2 lg:grid-cols-2">
            {active.map((deal) => (
              <div
                key={deal.id}
                className="rounded-xl bg-card p-3.5 shadow-sm ring-1 ring-primary/20"
              >
                <div className="flex gap-3">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg">
                    <Image
                      src={deal.image || "/images/bakery.jpg"}
                      alt={deal.dealName}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </div>
                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">{deal.dealName}</h3>
                      <p className="text-[11px] text-muted-foreground">{deal.storeName}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-primary">{formatPrice(deal.pricePaid)}</span>
                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        Before {deal.pickupBefore || "closing"}
                      </div>
                    </div>
                  </div>
                </div>
                {deal.storeAddress && (
                  <div className="mt-3 flex items-start gap-2 rounded-lg bg-secondary/60 px-3 py-2">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <p className="text-[11px] text-secondary-foreground">{deal.storeAddress}</p>
                  </div>
                )}
                <button className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
                  <Navigation className="h-4 w-4" />
                  Get Directions
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Past */}
      {!loading && past.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Past Claims
          </h2>
          <div className="mt-2.5 grid grid-cols-1 gap-2 lg:grid-cols-2">
            {past.map((deal) => (
              <div
                key={deal.id}
                className="rounded-xl bg-card p-3.5 opacity-70 shadow-sm ring-1 ring-border/50"
              >
                <div className="flex gap-3">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg">
                    <Image
                      src={deal.image || "/images/bakery.jpg"}
                      alt={deal.dealName}
                      fill
                      className="object-cover"
                      sizes="56px"
                    />
                  </div>
                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">{deal.dealName}</h3>
                      <p className="text-[11px] text-muted-foreground">{deal.storeName}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-foreground">{formatPrice(deal.pricePaid)}</span>
                      <div className="flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5">
                        <Package className="h-3 w-3 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground">
                          {deal.status === "Cancelled" ? "Cancelled" : "Picked up"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && orders.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Package className="mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm font-medium text-muted-foreground">No claims yet</p>
          <p className="mt-1 text-xs text-muted-foreground/70">
            Browse deals and claim your first one!
          </p>
          <Link
            href="/"
            className="mt-4 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Browse Deals
          </Link>
        </div>
      )}
    </div>
  )
}
