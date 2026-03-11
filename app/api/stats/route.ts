import { NextResponse } from "next/server"
import { connectMongo, hasMongoConfig } from "@/lib/mongodb"
import { readJsonFile, writeJsonFile } from "@/lib/storage"

export const dynamic = "force-dynamic"

const isProduction = process.env.NODE_ENV === "production" || process.env.VERCEL === "1"

export async function GET() {
  let client
  try {
    if (hasMongoConfig()) {
      const mongo = await connectMongo()
      client = mongo.client
      const ordersCount = await mongo.db.collection("orders").countDocuments({
        status: { $in: ["Pickup Ready", "Completed"] },
      })
      const doc = await mongo.db.collection("app_stats").findOne({ key: "global" })
      const mealsSaved = Math.max(Number(doc?.mealsSaved || 0), Number(ordersCount || 0))
      return NextResponse.json({
        ok: true,
        stats: {
          mealsSaved,
        },
      })
    }

    if (isProduction) {
      return NextResponse.json({ error: "Stats storage belum dikonfigurasi" }, { status: 503 })
    }

    const data = await readJsonFile<{ mealsSaved?: number }>("stats.json", { mealsSaved: 0 })
    const ordersData = await readJsonFile<{ orders?: Array<{ status?: string }> }>("orders.json", { orders: [] })
    const mealsFromOrders = Array.isArray(ordersData.orders)
      ? ordersData.orders.filter((o) => o.status === "Pickup Ready" || o.status === "Completed").length
      : 0
    const mealsSaved = Math.max(Number(data.mealsSaved || 0), Number(mealsFromOrders || 0))
    return NextResponse.json({ ok: true, stats: { mealsSaved } })
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
    const increment = Math.max(0, Number(body?.increment || 0))

    if (!increment) {
      return NextResponse.json({ error: "increment required" }, { status: 400 })
    }

    if (hasMongoConfig()) {
      const mongo = await connectMongo()
      client = mongo.client

      await mongo.db.collection("app_stats").updateOne(
        { key: "global" },
        {
          $inc: { mealsSaved: increment },
          $setOnInsert: { key: "global", createdAt: new Date() },
          $set: { updatedAt: new Date() },
        },
        { upsert: true }
      )

      const latest = await mongo.db.collection("app_stats").findOne({ key: "global" })
      return NextResponse.json({ ok: true, stats: { mealsSaved: Number(latest?.mealsSaved || 0) } })
    }

    if (isProduction) {
      return NextResponse.json({ error: "Stats storage belum dikonfigurasi" }, { status: 503 })
    }

    const data = await readJsonFile<{ mealsSaved?: number }>("stats.json", { mealsSaved: 0 })
    const next = { mealsSaved: Number(data.mealsSaved || 0) + increment }
    await writeJsonFile("stats.json", next)
    return NextResponse.json({ ok: true, stats: next })
  } catch (err: any) {
    return NextResponse.json({ error: "Server error", detail: err?.message || "Unknown error" }, { status: 500 })
  } finally {
    if (client) await client.close()
  }
}
