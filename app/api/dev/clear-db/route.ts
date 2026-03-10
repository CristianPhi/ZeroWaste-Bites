import { NextResponse } from "next/server"
import { writeJsonFile } from "@/lib/storage"
import { connectMongo, hasMongoConfig } from "@/lib/mongodb"

export async function POST() {
  let client;
  try {
    const isProduction = process.env.NODE_ENV === "production" || process.env.VERCEL === "1"

    if (isProduction) {
      return NextResponse.json({ error: "Disabled in production" }, { status: 403 })
    }

    if (hasMongoConfig()) {
      const mongo = await connectMongo()
      client = mongo.client
      const db = mongo.db

      await Promise.all([
        db.collection("users").deleteMany({}),
        db.collection("store_owners").deleteMany({}),
        db.collection("favorites").deleteMany({}),
        db.collection("saved_meals").deleteMany({}),
        db.collection("favorite_stores").deleteMany({}),
        db.collection("otps").deleteMany({}),
        db.collection("payments").deleteMany({}),
        db.collection("deals").deleteMany({}),
        db.collection("store_uploads").deleteMany({}),
      ])
    }

    await writeJsonFile("users.json", [])
    await writeJsonFile("favorites.json", { favorites: {} })
    await writeJsonFile("otps.json", [])
    await writeJsonFile("payments.json", { payments: [] })
    await writeJsonFile("deals.json", [])

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to clear db' }, { status: 500 })
  } finally {
    if (client) await client.close()
  }
}
