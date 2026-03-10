import { NextResponse } from "next/server"
import { connectMongo, hasMongoConfig } from "@/lib/mongodb"
import { readJsonFile, writeJsonFile } from "@/lib/storage"

export const dynamic = "force-dynamic"

type UploadedDeal = {
  id: string
  ownerEmail: string
  ownerName: string
  ownerUsername?: string
  storeName: string
  storeAvatar?: string
  itemName: string
  image: string
  originalPrice: number
  discountedPrice: number
  discountPercent: number
  quantity: number
  category: string
  expiresAt: string
  status: "active" | "inactive"
  claimed: number
  createdAt: string
}

const FILE_NAME = "deals.json"
const isProduction = process.env.NODE_ENV === "production" || process.env.VERCEL === "1"

async function readDealsFile(): Promise<UploadedDeal[]> {
  return await readJsonFile<UploadedDeal[]>(FILE_NAME, [])
}

async function writeDealsFile(deals: UploadedDeal[]) {
  await writeJsonFile(FILE_NAME, deals)
}

function toNumber(v: unknown, fallback: number) {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

export async function GET(req: Request) {
  let client
  try {
    const url = new URL(req.url)
    const ownerEmail = String(url.searchParams.get("ownerEmail") || "").trim().toLowerCase()

    if (hasMongoConfig()) {
      const mongo = await connectMongo()
      client = mongo.client
      const col = mongo.db.collection("store_uploads")
      const query: any = ownerEmail ? { ownerEmail } : {}
      const docs = await col.find(query).sort({ createdAt: -1 }).toArray()
      return NextResponse.json({ ok: true, deals: docs })
    }

    if (isProduction) {
      return NextResponse.json({ error: "Deals storage belum dikonfigurasi" }, { status: 503 })
    }

    const deals = await readDealsFile()
    const filtered = ownerEmail ? deals.filter((d) => d.ownerEmail === ownerEmail) : deals
    return NextResponse.json({ ok: true, deals: filtered })
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
    const ownerEmail = String(body?.ownerEmail || "").trim().toLowerCase()
    const ownerName = String(body?.ownerName || "").trim()
    const ownerUsername = String(body?.ownerUsername || "").trim()
    const storeName = String(body?.storeName || "").trim() || ownerName || "Store Owner"
    const storeAvatar = String(body?.storeAvatar || "").trim() || "/images/store-1.jpg"
    const itemName = String(body?.itemName || "").trim()
    const image = String(body?.image || "").trim()
    const originalPrice = Math.max(1000, Math.floor(toNumber(body?.originalPrice, 0)))
    const discountPercent = Math.max(1, Math.min(95, Math.floor(toNumber(body?.discountPercent, 50))))
    const quantity = Math.max(1, Math.floor(toNumber(body?.quantity, 1)))
    const category = String(body?.category || "Meals").trim() || "Meals"
    const expiresAt = String(body?.expiresAt || "Tonight, 10 PM").trim() || "Tonight, 10 PM"

    if (!ownerEmail || !itemName || !image) {
      return NextResponse.json({ error: "ownerEmail, itemName, image wajib diisi" }, { status: 400 })
    }

    const discountedPrice = Math.max(1000, Math.round(originalPrice * (1 - discountPercent / 100)))

    const deal: UploadedDeal = {
      id: `upload_${Date.now()}`,
      ownerEmail,
      ownerName,
      ownerUsername,
      storeName,
      storeAvatar,
      itemName,
      image,
      originalPrice,
      discountedPrice,
      discountPercent,
      quantity,
      category,
      expiresAt,
      status: "active",
      claimed: 0,
      createdAt: new Date().toISOString(),
    }

    if (hasMongoConfig()) {
      const mongo = await connectMongo()
      client = mongo.client
      await mongo.db.collection("store_uploads").insertOne(deal)
      return NextResponse.json({ ok: true, deal })
    }

    if (isProduction) {
      return NextResponse.json({ error: "Deals storage belum dikonfigurasi" }, { status: 503 })
    }

    const deals = await readDealsFile()
    deals.unshift(deal)
    await writeDealsFile(deals)

    return NextResponse.json({ ok: true, deal })
  } catch (err: any) {
    return NextResponse.json({ error: "Server error", detail: err?.message || "Unknown error" }, { status: 500 })
  } finally {
    if (client) await client.close()
  }
}
