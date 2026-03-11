import { NextResponse } from "next/server"
import { connectMongo, hasMongoConfig } from "@/lib/mongodb"
import { readJsonFile, writeJsonFile } from "@/lib/storage"

export const dynamic = "force-dynamic"

type UserRecord = {
  id: string
  name: string
  email: string
  username?: string
  role?: "customer" | "store_owner"
  avatar?: string
  password: string
  phone?: string
  favorites?: { savedDeals: string[]; favoriteStores: string[] }
  mealsSaved?: number
}

type StoreOwnerRecord = {
  email: string
  username?: string
  ownerName?: string
  phone?: string
  storeName?: string
  storeAvatar?: string
  storeAddress?: string
  storeClosingTime?: string
  storeRating?: number
  storeVerified?: boolean
  mealsSaved?: number
}

type DealRecord = {
  ownerEmail: string
  storeName?: string
  storeAvatar?: string
  storeAddress?: string
  storeClosingTime?: string
}

const isProduction = process.env.NODE_ENV === "production" || process.env.VERCEL === "1"

function normalizeEmail(email: string) {
  return String(email || "").trim().toLowerCase()
}

export async function GET(req: Request) {
  let client
  try {
    const url = new URL(req.url)
    const email = normalizeEmail(url.searchParams.get("email") || "")
    if (!email) return NextResponse.json({ error: "email required" }, { status: 400 })

    if (hasMongoConfig()) {
      const mongo = await connectMongo()
      client = mongo.client
      const db = mongo.db

      const user = await db.collection("users").findOne(
        { email },
        {
          projection: {
            password: 0,
          },
        }
      )
      const storeOwner = await db.collection("store_owners").findOne({ email })

      if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })
      return NextResponse.json({ ok: true, profile: user, storeOwner })
    }

    if (isProduction) {
      return NextResponse.json({ error: "Profile storage belum dikonfigurasi" }, { status: 503 })
    }

    const users = await readJsonFile<UserRecord[]>("users.json", [])
    const storeOwners = await readJsonFile<StoreOwnerRecord[]>("store_owners.json", [])
    const user = users.find((u) => normalizeEmail(u.email) === email)
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })
    const { password: _pw, ...safeUser } = user
    const storeOwner = storeOwners.find((s) => normalizeEmail(s.email) === email) || null
    return NextResponse.json({ ok: true, profile: safeUser, storeOwner })
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
    const email = normalizeEmail(body?.email || "")
    if (!email) return NextResponse.json({ error: "email required" }, { status: 400 })

    const avatar = String(body?.avatar || "").trim()
    const name = String(body?.name || "").trim()
    const storeName = String(body?.storeName || "").trim()
    const storeAddress = String(body?.storeAddress || "").trim()
    const storeClosingTime = String(body?.storeClosingTime || "").trim()
    const storeAvatar = String(body?.storeAvatar || "").trim()

    const userUpdates: Record<string, unknown> = {}
    if (avatar) userUpdates.avatar = avatar
    if (name) userUpdates.name = name

    const storeUpdates: Record<string, unknown> = {}
    if (storeName) storeUpdates.storeName = storeName
    if (storeAddress) storeUpdates.storeAddress = storeAddress
    if (storeClosingTime) storeUpdates.storeClosingTime = storeClosingTime
    if (storeAvatar) storeUpdates.storeAvatar = storeAvatar
    if (avatar && !storeAvatar) storeUpdates.storeAvatar = avatar

    if (hasMongoConfig()) {
      const mongo = await connectMongo()
      client = mongo.client
      const db = mongo.db

      const usersCol = db.collection("users")
      const storeOwnersCol = db.collection("store_owners")

      const currentUser = await usersCol.findOne({ email })
      if (!currentUser) return NextResponse.json({ error: "User not found" }, { status: 404 })

      if (Object.keys(userUpdates).length > 0) {
        await usersCol.updateOne({ email }, { $set: userUpdates })
      }

      if (currentUser.role === "store_owner" && Object.keys(storeUpdates).length > 0) {
        await storeOwnersCol.updateOne(
          { email },
          {
            $set: {
              ...storeUpdates,
              updatedAt: new Date(),
            },
            $setOnInsert: {
              email,
              username: currentUser.username,
              ownerName: currentUser.name,
              createdAt: new Date(),
            },
          },
          { upsert: true }
        )

        await db.collection("store_uploads").updateMany(
          { ownerEmail: email },
          {
            $set: {
              ...(storeName ? { storeName } : {}),
              ...(storeAddress ? { storeAddress } : {}),
              ...(storeClosingTime ? { storeClosingTime } : {}),
              ...(storeAvatar || avatar ? { storeAvatar: storeAvatar || avatar } : {}),
            },
          }
        )
      }

      const latestUser = await usersCol.findOne({ email }, { projection: { password: 0 } })
      const latestStoreOwner = await storeOwnersCol.findOne({ email })

      return NextResponse.json({ ok: true, profile: latestUser, storeOwner: latestStoreOwner })
    }

    if (isProduction) {
      return NextResponse.json({ error: "Profile storage belum dikonfigurasi" }, { status: 503 })
    }

    const users = await readJsonFile<UserRecord[]>("users.json", [])
    const idx = users.findIndex((u) => normalizeEmail(u.email) === email)
    if (idx < 0) return NextResponse.json({ error: "User not found" }, { status: 404 })

    const current = users[idx]
    users[idx] = {
      ...current,
      ...userUpdates,
    }
    await writeJsonFile("users.json", users)

    let latestStoreOwner: StoreOwnerRecord | null = null

    if (current.role === "store_owner") {
      const storeOwners = await readJsonFile<StoreOwnerRecord[]>("store_owners.json", [])
      const storeIdx = storeOwners.findIndex((s) => normalizeEmail(s.email) === email)
      const previous = storeIdx >= 0 ? storeOwners[storeIdx] : null

      const mergedStoreOwner: StoreOwnerRecord = {
        email,
        username: String(current.username || previous?.username || "").trim() || undefined,
        ownerName: String(current.name || previous?.ownerName || "").trim() || undefined,
        phone: String(current.phone || previous?.phone || "").trim() || undefined,
        storeName: (storeName || previous?.storeName || "").trim() || undefined,
        storeAddress: (storeAddress || previous?.storeAddress || "").trim() || undefined,
        storeClosingTime: (storeClosingTime || previous?.storeClosingTime || "").trim() || undefined,
        storeAvatar: (storeAvatar || avatar || previous?.storeAvatar || "").trim() || undefined,
        storeRating: previous?.storeRating,
        storeVerified: previous?.storeVerified,
        mealsSaved: previous?.mealsSaved,
      }

      if (storeIdx >= 0) {
        storeOwners[storeIdx] = mergedStoreOwner
      } else {
        storeOwners.push(mergedStoreOwner)
      }
      await writeJsonFile("store_owners.json", storeOwners)
      latestStoreOwner = mergedStoreOwner

      const deals = await readJsonFile<DealRecord[]>("deals.json", [])
      const nextDeals = deals.map((deal) => {
        if (normalizeEmail(String(deal.ownerEmail || "")) !== email) return deal
        return {
          ...deal,
          ...(storeName ? { storeName } : {}),
          ...(storeAddress ? { storeAddress } : {}),
          ...(storeClosingTime ? { storeClosingTime } : {}),
          ...(storeAvatar || avatar ? { storeAvatar: storeAvatar || avatar } : {}),
        }
      })
      await writeJsonFile("deals.json", nextDeals)
    }

    const { password: _pw, ...safeUser } = users[idx]
    return NextResponse.json({ ok: true, profile: safeUser, storeOwner: latestStoreOwner })
  } catch (err: any) {
    return NextResponse.json({ error: "Server error", detail: err?.message || "Unknown error" }, { status: 500 })
  } finally {
    if (client) await client.close()
  }
}
