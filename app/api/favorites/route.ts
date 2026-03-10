import { NextResponse } from "next/server"
import { readJsonFile, writeJsonFile } from "@/lib/storage"
import { connectMongo, hasMongoConfig } from "@/lib/mongodb"

type Favorites = {
  savedDeals: string[]
  favoriteStores: string[]
}

const FILE_NAME = "favorites.json"
const isProduction = process.env.NODE_ENV === "production"

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

function sanitizeFavorites(input: Partial<Favorites> | null | undefined): Favorites {
  return {
    savedDeals: Array.isArray(input?.savedDeals) ? input!.savedDeals : [],
    favoriteStores: Array.isArray(input?.favoriteStores) ? input!.favoriteStores : [],
  }
}

async function readFile(): Promise<Record<string, Favorites>> {
  const data = await readJsonFile<{ favorites?: Record<string, Favorites> }>(FILE_NAME, { favorites: {} })
  return data.favorites || {}
}

async function writeFile(favs: Record<string, Favorites>) {
  const payload = { favorites: favs }
  await writeJsonFile(FILE_NAME, payload)
}

export async function GET(req: Request) {
  let client;
  try {
    const url = new URL(req.url)
    const email = url.searchParams.get("email")
    if (!email) return NextResponse.json({ error: "email required" }, { status: 400 })

    const normalizedEmail = normalizeEmail(email)

    if (hasMongoConfig()) {
      const mongo = await connectMongo()
      client = mongo.client
      const doc = await mongo.db.collection("favorites").findOne({ email: normalizedEmail })
      return NextResponse.json({
        ok: true,
        favorites: sanitizeFavorites(doc?.favorites),
      })
    }

    if (isProduction) {
      return NextResponse.json({ error: "Favorites storage belum dikonfigurasi" }, { status: 503 })
    }

    const all = await readFile()
    const fav = sanitizeFavorites(all[normalizedEmail])
    return NextResponse.json({ ok: true, favorites: fav })
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  } finally {
    if (client) await client.close()
  }
}

export async function POST(req: Request) {
  let client;
  try {
    const body = await req.json()
    const { email, action, type, id } = body as {
      email?: string
      action?: "add" | "remove"
      type?: "deal" | "store"
      id?: string
    }

    if (!email || !action || !type || !id) {
      return NextResponse.json({ error: "email, action, type, id required" }, { status: 400 })
    }

    const normalizedEmail = normalizeEmail(email)

    if (hasMongoConfig()) {
      const mongo = await connectMongo()
      client = mongo.client
      const col = mongo.db.collection("favorites")

      const update =
        action === "add"
          ? type === "deal"
            ? { $addToSet: { "favorites.savedDeals": id } }
            : { $addToSet: { "favorites.favoriteStores": id } }
          : type === "deal"
            ? { $pull: { "favorites.savedDeals": id } }
            : { $pull: { "favorites.favoriteStores": id } }

      await col.updateOne(
        { email: normalizedEmail },
        {
          $setOnInsert: {
            email: normalizedEmail,
            favorites: { savedDeals: [], favoriteStores: [] },
          },
          ...update,
        },
        { upsert: true }
      )

      const latest = await col.findOne({ email: normalizedEmail })
      return NextResponse.json({ ok: true, favorites: sanitizeFavorites(latest?.favorites) })
    }

    if (isProduction) {
      return NextResponse.json({ error: "Favorites storage belum dikonfigurasi" }, { status: 503 })
    }

    const all = await readFile()
    const current = sanitizeFavorites(all[normalizedEmail])

    if (action === "add") {
      if (type === "deal") {
        if (!current.savedDeals.includes(id)) current.savedDeals.push(id)
      } else {
        if (!current.favoriteStores.includes(id)) current.favoriteStores.push(id)
      }
    } else if (action === "remove") {
      if (type === "deal") {
        current.savedDeals = current.savedDeals.filter((x) => x !== id)
      } else {
        current.favoriteStores = current.favoriteStores.filter((x) => x !== id)
      }
    }

    all[normalizedEmail] = current
    await writeFile(all)

    return NextResponse.json({ ok: true, favorites: current })
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  } finally {
    if (client) await client.close()
  }
}
