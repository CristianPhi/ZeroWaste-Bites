import { NextResponse } from "next/server"
import { connectMongo, hasMongoConfig } from "@/lib/mongodb"
import { readJsonFile, writeJsonFile } from "@/lib/storage"

export const dynamic = "force-dynamic"

type OrderRecord = {
  id: string
  userEmail: string
  dealId: string
  dealName: string
  storeName: string
  storeAvatar?: string
  storeAddress?: string
  image: string
  pricePaid: number
  originalPrice?: number
  discountedPrice?: number
  quantity?: number
  estimatedSaved?: number
  pickupBefore: string
  status: "Pickup Ready" | "Completed" | "Cancelled"
  claimedAt: string
}

const FILE_NAME = "orders.json"
const isProduction = process.env.NODE_ENV === "production" || process.env.VERCEL === "1"

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

async function readOrdersFile(): Promise<OrderRecord[]> {
  const data = await readJsonFile<{ orders?: OrderRecord[] }>(FILE_NAME, { orders: [] })
  return Array.isArray(data.orders) ? data.orders : []
}

async function writeOrdersFile(orders: OrderRecord[]) {
  await writeJsonFile(FILE_NAME, { orders })
}

export async function GET(req: Request) {
  let client
  try {
    const url = new URL(req.url)
    const email = url.searchParams.get("email")

    if (!email) {
      return NextResponse.json({ error: "email required" }, { status: 400 })
    }

    const normalizedEmail = normalizeEmail(email)

    if (hasMongoConfig()) {
      const mongo = await connectMongo()
      client = mongo.client
      const col = mongo.db.collection("orders")
      const orders = await col
        .find({ userEmail: normalizedEmail })
        .sort({ claimedAt: -1 })
        .toArray()
      return NextResponse.json({ ok: true, orders })
    }

    if (isProduction) {
      return NextResponse.json({ error: "Orders storage belum dikonfigurasi" }, { status: 503 })
    }

    const orders = await readOrdersFile()
    const filtered = orders.filter((o) => o.userEmail === normalizedEmail)
    return NextResponse.json({ ok: true, orders: filtered })
  } catch (err: any) {
    return NextResponse.json({ error: "Server error", detail: err?.message || "Unknown error" }, { status: 500 })
  } finally {
    if (client) await client.close()
  }
}

export async function POST(req: Request) {
  let client
  try {
    const body = await req.json()
    const userEmail = String(body?.userEmail || "").trim().toLowerCase()
    const dealId = String(body?.dealId || "").trim()
    const dealName = String(body?.dealName || "").trim()
    const storeName = String(body?.storeName || "").trim()
    const storeAvatar = String(body?.storeAvatar || "").trim()
    const storeAddress = String(body?.storeAddress || "").trim()
    const image = String(body?.image || "").trim()
    const pricePaid = Number(body?.pricePaid) || 0
    const originalPrice = Math.max(0, Number(body?.originalPrice) || 0)
    const discountedPrice = Math.max(0, Number(body?.discountedPrice) || 0)
    const quantity = Math.max(1, Math.floor(Number(body?.quantity) || 1))
    const pickupBefore = String(body?.pickupBefore || "").trim()

    if (!userEmail || !dealId || !dealName || !storeName) {
      return NextResponse.json(
        { error: "userEmail, dealId, dealName, storeName wajib diisi" },
        { status: 400 }
      )
    }

    const order: OrderRecord = {
      id: `order_${Date.now()}`,
      userEmail,
      dealId,
      dealName,
      storeName,
      storeAvatar: storeAvatar || "/images/store-1.jpg",
      storeAddress,
      image: image || "/images/bakery.jpg",
      pricePaid,
      originalPrice,
      discountedPrice,
      quantity,
      estimatedSaved: Math.max(0, originalPrice - discountedPrice) * quantity,
      pickupBefore,
      status: "Pickup Ready",
      claimedAt: new Date().toISOString(),
    }

    if (hasMongoConfig()) {
      const mongo = await connectMongo()
      client = mongo.client
      const db = mongo.db

      // Increment claimed count on the deal
      await db.collection("store_uploads").updateOne(
        { id: dealId },
        { $inc: { claimed: 1 } }
      )

      await db.collection("orders").insertOne(order)

      await db.collection("app_stats").updateOne(
        { key: "global" },
        {
          $inc: { mealsSaved: 1 },
          $setOnInsert: { key: "global", createdAt: new Date() },
          $set: { updatedAt: new Date() },
        },
        { upsert: true }
      )

      await db.collection("users").updateOne(
        { email: userEmail },
        { $inc: { mealsSaved: 1 } }
      )

      const deal = await db.collection("store_uploads").findOne({ id: dealId })
      if (deal?.ownerEmail) {
        await db.collection("store_owners").updateOne(
          { email: String(deal.ownerEmail).toLowerCase() },
          {
            $inc: { mealsSaved: 1 },
            $setOnInsert: {
              email: String(deal.ownerEmail).toLowerCase(),
              username: deal.ownerUsername,
              ownerName: deal.ownerName,
              createdAt: new Date(),
            },
          },
          { upsert: true }
        )
      }

      return NextResponse.json({ ok: true, order })
    }

    if (isProduction) {
      return NextResponse.json({ error: "Orders storage belum dikonfigurasi" }, { status: 503 })
    }

    const orders = await readOrdersFile()
    orders.unshift(order)
    await writeOrdersFile(orders)

    const stats = await readJsonFile<{ mealsSaved?: number }>("stats.json", { mealsSaved: 0 })
    await writeJsonFile("stats.json", { mealsSaved: Number(stats.mealsSaved || 0) + 1 })

    return NextResponse.json({ ok: true, order })
  } catch (err: any) {
    return NextResponse.json({ error: "Server error", detail: err?.message || "Unknown error" }, { status: 500 })
  } finally {
    if (client) await client.close()
  }
}

export async function PATCH(req: Request) {
  let client
  try {
    const body = await req.json()
    const orderId = String(body?.orderId || "").trim()
    const status = String(body?.status || "").trim() as OrderRecord["status"]

    if (!orderId || !["Completed", "Cancelled", "Pickup Ready"].includes(status)) {
      return NextResponse.json({ error: "orderId and valid status required" }, { status: 400 })
    }

    if (hasMongoConfig()) {
      const mongo = await connectMongo()
      client = mongo.client
      await mongo.db.collection("orders").updateOne(
        { id: orderId },
        { $set: { status } }
      )
      return NextResponse.json({ ok: true })
    }

    if (isProduction) {
      return NextResponse.json({ error: "Orders storage belum dikonfigurasi" }, { status: 503 })
    }

    const orders = await readOrdersFile()
    const idx = orders.findIndex((o) => o.id === orderId)
    if (idx >= 0) {
      orders[idx].status = status
      await writeOrdersFile(orders)
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: "Server error", detail: err?.message || "Unknown error" }, { status: 500 })
  } finally {
    if (client) await client.close()
  }
}
