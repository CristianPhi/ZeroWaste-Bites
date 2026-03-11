import { NextResponse } from "next/server"
import { connectMongo, hasMongoConfig } from "@/lib/mongodb"
import { readJsonFile } from "@/lib/storage"

export const dynamic = "force-dynamic"

const isProduction = process.env.NODE_ENV === "production" || process.env.VERCEL === "1"

function toSlug(value: string) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

function emailLocalPart(value: string) {
  const email = String(value || "").trim().toLowerCase()
  const at = email.indexOf("@")
  if (at <= 0) return ""
  return email.slice(0, at)
}

function normalizeRequestedIds(rawId: string) {
  const base = String(rawId || "").trim().toLowerCase()
  const noPrefix = base.startsWith("store-") ? base.slice(6) : base
  const ids = new Set<string>([base, noPrefix, toSlug(base), toSlug(noPrefix)])
  return Array.from(ids).filter(Boolean)
}

function matchesStoreId(item: any, candidates: string[]) {
  const ownerUsername = String(item?.ownerUsername || item?.username || "").trim().toLowerCase()
  const ownerEmail = String(item?.ownerEmail || item?.email || "").trim().toLowerCase()
  const localPart = emailLocalPart(ownerEmail)

  const normalized = new Set<string>([
    ownerUsername,
    toSlug(ownerUsername),
    ownerEmail,
    localPart,
    toSlug(localPart),
  ])

  return candidates.some((id) => normalized.has(id))
}

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
    const candidateIds = normalizeRequestedIds(storeId)

    if (hasMongoConfig()) {
      const mongo = await connectMongo()
      client = mongo.client
      const db = mongo.db

      // Read then normalize-match to support legacy and slug IDs consistently.
      const owners = await db.collection("store_owners").find({}).toArray()
      const owner = owners.find((o) => matchesStoreId(o, candidateIds))

      const allDealDocs = await db
        .collection("store_uploads")
        .find({})
        .sort({ createdAt: -1 })
        .toArray()
      const dealDocs = allDealDocs.filter((d) => matchesStoreId(d, candidateIds))

      // Build store profile: prefer store_owners, fallback to first deal
      const firstDeal = dealDocs[0]
      const store = {
        id: toSlug(String(owner?.username || owner?.email || firstDeal?.ownerUsername || firstDeal?.ownerEmail || storeId)),
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
    const storeDeals = deals.filter((d) => matchesStoreId(d, candidateIds))

    if (storeDeals.length === 0) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 })
    }

    const firstDeal = storeDeals[0]
    const store = {
      id: toSlug(String(firstDeal.ownerUsername || firstDeal.ownerEmail || storeId)),
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
