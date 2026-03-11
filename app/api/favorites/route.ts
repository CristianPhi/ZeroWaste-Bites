import { NextResponse } from "next/server"
import { connectMongo, hasMongoConfig } from "@/lib/mongodb"

export const dynamic = "force-dynamic"

// Helper untuk merapikan email
function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

function escapeRegex(value: string) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

// Helper untuk memastikan objek favorites selalu punya array
function sanitize(favs: any) {
  return {
      savedDeals: Array.isArray(favs?.savedDeals) ? favs.savedDeals : [],
      favoriteStores: Array.isArray(favs?.favoriteStores) ? favs.favoriteStores : [],
    }
}

async function readMergedFavorites(db: any, normalizedEmail: string) {
  const escaped = escapeRegex(normalizedEmail)
  const usersCol = db.collection("users")
  const savedMealsCol = db.collection("saved_meals")
  const favoriteStoresCol = db.collection("favorite_stores")

  const userDoc = await usersCol.findOne({
    $or: [
      { email: normalizedEmail },
      { email: { $regex: `^${escaped}$`, $options: "i" } },
    ],
  })

  const fromUser = sanitize(userDoc?.favorites)

  const [savedMealDocs, favoriteStoreDocs] = await Promise.all([
    savedMealsCol
      .find({
        $or: [
          { email: normalizedEmail },
          { email: { $regex: `^${escaped}$`, $options: "i" } },
        ],
      })
      .project({ dealId: 1 })
      .toArray(),
    favoriteStoresCol
      .find({
        $or: [
          { email: normalizedEmail },
          { email: { $regex: `^${escaped}$`, $options: "i" } },
        ],
      })
      .project({ storeId: 1 })
      .toArray(),
  ])

  const savedDeals = new Set<string>(fromUser.savedDeals.map((v: any) => String(v)))
  const favoriteStores = new Set<string>(fromUser.favoriteStores.map((v: any) => String(v)))

  for (const doc of savedMealDocs) {
    const id = String(doc?.dealId || "").trim()
    if (id) savedDeals.add(id)
  }
  for (const doc of favoriteStoreDocs) {
    const id = String(doc?.storeId || "").trim()
    if (id) favoriteStores.add(id)
  }

  return {
    savedDeals: Array.from(savedDeals),
    favoriteStores: Array.from(favoriteStores),
  }
}

// --- GET: Mengambil data tanpa merusak database ---
export async function GET(req: Request) {
  let client;
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
    const favorites = await readMergedFavorites(mongo.db, normalizedEmail)

    return NextResponse.json({ ok: true, favorites })
  } catch (err) {
    console.error("GET Error:", err)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  } finally {
    if (client) await client.close()
  }
}

// --- POST: Menambah atau Menghapus data ---
export async function POST(req: Request) {
  let client;
  try {
    const body = await req.json()
    const { email, action, type, id } = body as {
      email: string;
      action: "add" | "remove";
      type: "deal" | "store";
      id: string;
    }

    if (!email || !action || !type || !id) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 })
    }

    const normalizedEmail = normalizeEmail(email)

    if (!hasMongoConfig()) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 })
    }

    const mongo = await connectMongo()
    client = mongo.client
    
    const usersCol = mongo.db.collection("users")
    const savedMealsCol = mongo.db.collection("saved_meals")
    const favoriteStoresCol = mongo.db.collection("favorite_stores")

    // 1. Tentukan query update untuk koleksi Users
    const field = type === "deal" ? "favorites.savedDeals" : "favorites.favoriteStores"
    const targetId = String(id).trim()
    const updateQuery: any = action === "add"
      ? { $addToSet: { [field]: targetId } }
      : { $pull: { [field]: { $in: [targetId] } } }

    // 2. Update koleksi Users (Gunakan upsert agar field favorites terbuat otomatis)
    await usersCol.updateOne(
      { email: normalizedEmail },
      updateQuery,
      { upsert: true }
    )

    // 3. Update koleksi spesifik (saved_meals atau favorite_stores) untuk kemudahan query lain
    if (type === "deal") {
      if (action === "add") {
        await savedMealsCol.updateOne(
          { email: normalizedEmail, dealId: targetId },
          { $set: { email: normalizedEmail, dealId: targetId, updatedAt: new Date() } },
          { upsert: true }
        )
      } else {
        await savedMealsCol.deleteOne({ email: normalizedEmail, dealId: targetId })
      }
    } else {
      if (action === "add") {
        await favoriteStoresCol.updateOne(
          { email: normalizedEmail, storeId: targetId },
          { $set: { email: normalizedEmail, storeId: targetId, updatedAt: new Date() } },
          { upsert: true }
        )
      } else {
        await favoriteStoresCol.deleteOne({ email: normalizedEmail, storeId: targetId })
      }
    }

    // 4. Ambil data terbaru untuk dikirim balik ke UI
    const updatedFavorites = await readMergedFavorites(mongo.db, normalizedEmail)
    return NextResponse.json({ ok: true, favorites: updatedFavorites })

  } catch (err) {
    console.error("POST Error:", err)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  } finally {
    if (client) await client.close()
  }
}