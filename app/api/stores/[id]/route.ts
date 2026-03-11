import { NextResponse } from "next/server"
import { connectMongo, hasMongoConfig } from "@/lib/mongodb"
import { readJsonFile } from "@/lib/storage"

export const dynamic = "force-dynamic"

const isProduction = process.env.NODE_ENV === "production" || process.env.VERCEL === "1"

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  let client
  try {
    const storeId = String(params?.id || "").trim().toLowerCase()
    if (!storeId) {
      return NextResponse.json({ error: "Store id required" }, { status: 400 })
    }

    if (hasMongoConfig()) {
      const mongo = await connectMongo()
      client = mongo.client
      const db = mongo.db

      const storeIdAsEmail = storeId.includes("@") ? storeId : `${storeId}@`

      // Try to get store profile from store_owners
      const owner = await db.collection("store_owners").findOne({
        $or: [
          { username: storeId },
          { email: storeId },
          { email: { $regex: `^${storeIdAsEmail}`, $options: "i" } },
        ],
      })

      // Get deals for this store owner
      const dealDocs = await db
        .collection("store_uploads")
        .find({
          $or: [
            { ownerUsername: storeId },
            { ownerEmail: storeId },
            { ownerEmail: { $regex: `^${storeIdAsEmail}`, $options: "i" } },
          ],
        })
        .sort({ createdAt: -1 })
        .toArray()

      // Build store profile: prefer store_owners, fallback to first deal
      const firstDeal = dealDocs[0]
      const store = {
        id: storeId,
        name: String(
          owner?.storeName || owner?.ownerName || firstDeal?.storeName || "Store"
        ),
        avatar: String(
          owner?.storeAvatar || firstDeal?.storeAvatar || "/images/store-1.jpg"
        ),
        address: String(owner?.storeAddress || firstDeal?.storeAddress || ""),
        closingTime: String(
          owner?.storeClosingTime || firstDeal?.storeClosingTime || ""
        ),
        distance: "",
        rating: Number(owner?.storeRating ?? firstDeal?.storeRating ?? 4.5),
        verified: Boolean(owner?.storeVerified ?? firstDeal?.storeVerified ?? false),
      }

      if (!owner && dealDocs.length === 0) {
        return NextResponse.json({ error: "Store not found" }, { status: 404 })
      }

      return NextResponse.json({ ok: true, store, deals: dealDocs })
    }

    if (isProduction) {
      return NextResponse.json({ error: "Storage belum dikonfigurasi" }, { status: 503 })
    }

    // Local dev fallback
    const deals = await readJsonFile<any[]>("deals.json", [])
    const storeDeals = deals.filter(
      (d) =>
        (
          String(d.ownerUsername || "").toLowerCase() === storeId ||
          String(d.ownerEmail || "").toLowerCase() === storeId ||
          String(d.ownerEmail || "").toLowerCase().startsWith(`${storeId}@`)
        )
    )

    if (storeDeals.length === 0) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 })
    }

    const firstDeal = storeDeals[0]
    const store = {
      id: storeId,
      name: firstDeal.storeName || "Store",
      avatar: firstDeal.storeAvatar || "/images/store-1.jpg",
      address: firstDeal.storeAddress || "",
      closingTime: firstDeal.storeClosingTime || "",
      distance: "",
      rating: firstDeal.storeRating || 4.5,
      verified: firstDeal.storeVerified || false,
    }

    return NextResponse.json({ ok: true, store, deals: storeDeals })
  } catch (err: any) {
    return NextResponse.json({ error: "Server error", detail: err?.message || "Unknown error" }, { status: 500 })
  } finally {
    if (client) await client.close()
  }
}
