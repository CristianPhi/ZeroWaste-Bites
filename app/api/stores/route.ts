import { NextResponse } from "next/server"
import { connectMongo, hasMongoConfig } from "@/lib/mongodb"
import { readJsonFile } from "@/lib/storage"

export const dynamic = "force-dynamic"

const isProduction = process.env.NODE_ENV === "production" || process.env.VERCEL === "1"

export async function GET() {
  let client
  try {
    if (hasMongoConfig()) {
      const mongo = await connectMongo()
      client = mongo.client
      const db = mongo.db

      // Aggregate stores from store_owners, enriched with deal counts from store_uploads
      const owners = await db
        .collection("store_owners")
        .find({})
        .sort({ createdAt: -1 })
        .toArray()

      // Also pick up any stores from uploads that don't have a store_owners record yet
      const uploads = await db
        .collection("store_uploads")
        .find({ status: "active" })
        .sort({ createdAt: -1 })
        .toArray()

      // Build a map: username -> store info
      const storeMap = new Map<string, {
        id: string
        name: string
        avatar: string
        address: string
        closingTime: string
        rating: number
        verified: boolean
        dealCount: number
      }>()

      // Seed from store_owners
      for (const owner of owners) {
        const id = String(owner.username || owner.email.split("@")[0]).toLowerCase()
        storeMap.set(id, {
          id,
          name: String(owner.storeName || owner.ownerName || "Store"),
          avatar: String(owner.storeAvatar || "/images/store-1.jpg"),
          address: String(owner.storeAddress || ""),
          closingTime: String(owner.storeClosingTime || ""),
          rating: Number(owner.storeRating) || 4.5,
          verified: Boolean(owner.storeVerified),
          dealCount: 0,
        })
      }

      // Count deals and fill in missing stores from uploads
      for (const deal of uploads) {
        const id = String(deal.ownerUsername || deal.ownerEmail.split("@")[0]).toLowerCase()
        if (storeMap.has(id)) {
          storeMap.get(id)!.dealCount += 1
        } else {
          storeMap.set(id, {
            id,
            name: String(deal.storeName || "Store"),
            avatar: String(deal.storeAvatar || "/images/store-1.jpg"),
            address: String(deal.storeAddress || ""),
            closingTime: String(deal.storeClosingTime || ""),
            rating: Number(deal.storeRating) || 4.5,
            verified: Boolean(deal.storeVerified),
            dealCount: 1,
          })
        }
      }

      const stores = Array.from(storeMap.values())
      return NextResponse.json({ ok: true, stores })
    }

    if (isProduction) {
      return NextResponse.json({ error: "Storage belum dikonfigurasi" }, { status: 503 })
    }

    // Local dev fallback: derive from deals.json
    const deals = await readJsonFile<any[]>("deals.json", [])
    const storeMap = new Map<string, any>()

    for (const deal of deals) {
      if (deal.status !== "active") continue
      const id = String(deal.ownerUsername || deal.ownerEmail?.split("@")[0] || "unknown").toLowerCase()
      if (storeMap.has(id)) {
        storeMap.get(id).dealCount += 1
      } else {
        storeMap.set(id, {
          id,
          name: deal.storeName || "Store",
          avatar: deal.storeAvatar || "/images/store-1.jpg",
          address: deal.storeAddress || "",
          closingTime: deal.storeClosingTime || "",
          rating: deal.storeRating || 4.5,
          verified: deal.storeVerified || false,
          dealCount: 1,
        })
      }
    }

    return NextResponse.json({ ok: true, stores: Array.from(storeMap.values()) })
  } catch (err: any) {
    return NextResponse.json({ error: "Server error", detail: err?.message || "Unknown error" }, { status: 500 })
  } finally {
    if (client) await client.close()
  }
}
