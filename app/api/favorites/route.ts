import { NextResponse } from "next/server"
import { connectMongo, hasMongoConfig } from "@/lib/mongodb"

// Helper untuk merapikan email
function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

// Helper untuk memastikan objek favorites selalu punya array
function sanitize(favs: any) {
  return {
      savedDeals: Array.isArray(favs?.savedDeals) ? favs.savedDeals : [],
      favoriteStores: Array.isArray(favs?.favoriteStores) ? favs.favoriteStores : [],
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
    const usersCol = mongo.db.collection("users")
    
    // Ambil data dari User Document (Single Source of Truth)
    const userDoc = await usersCol.findOne({ email: normalizedEmail })
    const favorites = sanitize(userDoc?.favorites)

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
    const mongo = await connectMongo()
    client = mongo.client
    
    const usersCol = mongo.db.collection("users")
    const savedMealsCol = mongo.db.collection("saved_meals")
    const favoriteStoresCol = mongo.db.collection("favorite_stores")

    // 1. Tentukan query update untuk koleksi Users
    const field = type === "deal" ? "favorites.savedDeals" : "favorites.favoriteStores"
    const updateQuery: any = action === "add"
      ? { $addToSet: { [field]: id } }
      : { $pull: { [field]: { $in: [id] } } }

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
          { email: normalizedEmail, dealId: id },
          { $set: { email: normalizedEmail, dealId: id, updatedAt: new Date() } },
          { upsert: true }
        )
      } else {
        await savedMealsCol.deleteOne({ email: normalizedEmail, dealId: id })
      }
    } else {
      if (action === "add") {
        await favoriteStoresCol.updateOne(
          { email: normalizedEmail, storeId: id },
          { $set: { email: normalizedEmail, storeId: id, updatedAt: new Date() } },
          { upsert: true }
        )
      } else {
        await favoriteStoresCol.deleteOne({ email: normalizedEmail, storeId: id })
      }
    }

    // 4. Ambil data terbaru untuk dikirim balik ke UI
    const updatedUser = await usersCol.findOne({ email: normalizedEmail })
    return NextResponse.json({ ok: true, favorites: sanitize(updatedUser?.favorites) })

  } catch (err) {
    console.error("POST Error:", err)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  } finally {
    if (client) await client.close()
  }
}