import { NextResponse } from "next/server"
import { connectMongo, hasMongoConfig } from "@/lib/mongodb"

export const dynamic = "force-dynamic"

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

function escapeRegex(value: string) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

// GET: Get total money saved for a user
export async function GET(req: Request) {
  let client
  try {
    const { searchParams } = new URL(req.url)
    const email = searchParams.get("email")
    if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 })

    const normalizedEmail = normalizeEmail(email)

    if (!hasMongoConfig()) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 })
    }

    const mongo = await connectMongo()
    client = mongo.client
    const db = mongo.db

    const escaped = escapeRegex(normalizedEmail)
    const savedMoneyCol = db.collection("saved_money")

    // Get all saved money records for this user
    const records = await savedMoneyCol
      .find({
        $or: [
          { email: normalizedEmail },
          { email: { $regex: `^${escaped}$`, $options: "i" } },
        ],
      })
      .toArray()

    const totalSaved = records.reduce((sum, record) => sum + (Number(record.amountSaved) || 0), 0)

    return NextResponse.json({
      ok: true,
      totalSaved,
      records: records.length,
    })
  } catch (err) {
    console.error("GET saved-money error:", err)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  } finally {
    if (client) await client.close()
  }
}

// POST: Log money saved when a deal is claimed
export async function POST(req: Request) {
  let client
  try {
    const body = await req.json()
    const { email, dealId, amountSaved, storeName, itemName } = body as {
      email: string
      dealId: string
      amountSaved: number
      storeName?: string
      itemName?: string
    }

    if (!email || !dealId || amountSaved === undefined || amountSaved <= 0) {
      return NextResponse.json(
        { error: "Missing or invalid fields: email, dealId, amountSaved (must be > 0)" },
        { status: 400 }
      )
    }

    const normalizedEmail = normalizeEmail(email)

    if (!hasMongoConfig()) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 })
    }

    const mongo = await connectMongo()
    client = mongo.client
    const db = mongo.db

    const savedMoneyCol = db.collection("saved_money")

    // Insert a new record for this saved money entry
    const result = await savedMoneyCol.insertOne({
      email: normalizedEmail,
      dealId: String(dealId).trim(),
      amountSaved: Number(amountSaved),
      storeName: String(storeName || ""),
      itemName: String(itemName || ""),
      createdAt: new Date(),
    })

    // Also update the user document to track total saved money
    const usersCol = db.collection("users")
    await usersCol.updateOne(
      { email: normalizedEmail },
      {
        $inc: { totalMoneySaved: Number(amountSaved) },
      },
      { upsert: true }
    )

    return NextResponse.json({
      ok: true,
      recordId: result.insertedId,
      amountSaved,
    })
  } catch (err) {
    console.error("POST saved-money error:", err)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  } finally {
    if (client) await client.close()
  }
}
