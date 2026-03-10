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

function unique(values: string[]) {
  return Array.from(new Set(values))
}

function mergeFavorites(primary?: Partial<Favorites> | null, secondary?: Partial<Favorites> | null): Favorites {
  const a = sanitizeFavorites(primary)
  const b = sanitizeFavorites(secondary)
  return {
    savedDeals: unique([...a.savedDeals, ...b.savedDeals]),
    favoriteStores: unique([...a.favoriteStores, ...b.favoriteStores]),
  }
}

function escapeRegex(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function buildEmailFilter(normalizedEmail: string) {
  return {
    $or: [
      { email: normalizedEmail },
      { email: { $regex: `^${escapeRegex(normalizedEmail)}$`, $options: "i" } },
    ],
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
      const usersCol = mongo.db.collection("users")
      const favoritesCol = mongo.db.collection("favorites")
      const savedMealsCol = mongo.db.collection("saved_meals")
      const favoriteStoresCol = mongo.db.collection("favorite_stores")
      const emailFilter = buildEmailFilter(normalizedEmail)

      const userDoc = await usersCol.findOne(
        emailFilter,
        { projection: { favorites: 1 } }
      )
      const legacyDoc = await favoritesCol.findOne(
        emailFilter,
        { projection: { favorites: 1 } }
      )
      const savedMeals = await savedMealsCol
        .find({ email: normalizedEmail }, { projection: { dealId: 1 } })
        .toArray()
      const favoriteStores = await favoriteStoresCol
        .find({ email: normalizedEmail }, { projection: { storeId: 1 } })
        .toArray()

      const collectionFavorites: Favorites = {
        savedDeals: unique(savedMeals.map((x: any) => String(x.dealId || "")).filter(Boolean)),
        favoriteStores: unique(favoriteStores.map((x: any) => String(x.storeId || "")).filter(Boolean)),
      }

      const merged = mergeFavorites(mergeFavorites(userDoc?.favorites, legacyDoc?.favorites), collectionFavorites)

      if (userDoc) {
        await usersCol.updateOne(
          { _id: userDoc._id },
          { $set: { favorites: merged } }
        )
      }

      if (legacyDoc) {
        await favoritesCol.updateOne(
          { _id: legacyDoc._id },
          { $set: { email: normalizedEmail, favorites: merged } }
        )
      }

      await savedMealsCol.deleteMany({ email: normalizedEmail })
      await favoriteStoresCol.deleteMany({ email: normalizedEmail })
      if (merged.savedDeals.length > 0) {
        await savedMealsCol.insertMany(merged.savedDeals.map((dealId) => ({ email: normalizedEmail, dealId })))
      }
      if (merged.favoriteStores.length > 0) {
        await favoriteStoresCol.insertMany(merged.favoriteStores.map((storeId) => ({ email: normalizedEmail, storeId })))
      }

      return NextResponse.json({
        ok: true,
        favorites: merged,
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
      const usersCol = mongo.db.collection("users")
      const fallbackCol = mongo.db.collection("favorites")
      const savedMealsCol = mongo.db.collection("saved_meals")
      const favoriteStoresCol = mongo.db.collection("favorite_stores")
      const emailFilter = buildEmailFilter(normalizedEmail)
      const update =
        action === "add"
          ? type === "deal"
            ? { $addToSet: { "favorites.savedDeals": id } }
            : { $addToSet: { "favorites.favoriteStores": id } }
          : type === "deal"
            ? { $pull: { "favorites.savedDeals": id } }
            : { $pull: { "favorites.favoriteStores": id } }

      const userDoc = await usersCol.findOne(emailFilter, { projection: { _id: 1 } })

      if (userDoc) {
        await usersCol.updateOne(
          { _id: userDoc._id },
          {
            $setOnInsert: { favorites: { savedDeals: [], favoriteStores: [] } },
            ...update,
          }
        )

        const latestUser = await usersCol.findOne(
          { _id: userDoc._id },
          { projection: { favorites: 1, email: 1 } }
        )
        const latestFavorites = sanitizeFavorites(latestUser?.favorites)

        await fallbackCol.updateOne(
          { email: normalizedEmail },
          {
            $set: {
              email: normalizedEmail,
              favorites: latestFavorites,
            },
          },
          { upsert: true }
        )

        if (type === "deal") {
          if (action === "add") {
            await savedMealsCol.updateOne(
              { email: normalizedEmail, dealId: id },
              { $set: { email: normalizedEmail, dealId: id } },
              { upsert: true }
            )
          } else {
            await savedMealsCol.deleteOne({ email: normalizedEmail, dealId: id })
          }
        } else {
          if (action === "add") {
            await favoriteStoresCol.updateOne(
              { email: normalizedEmail, storeId: id },
              { $set: { email: normalizedEmail, storeId: id } },
              { upsert: true }
            )
          } else {
            await favoriteStoresCol.deleteOne({ email: normalizedEmail, storeId: id })
          }
        }

        return NextResponse.json({ ok: true, favorites: latestFavorites })
      }

      await fallbackCol.updateOne(
        { email: normalizedEmail },
        {
          $setOnInsert: { favorites: { savedDeals: [], favoriteStores: [] } },
          ...update,
        },
        { upsert: true }
      )

      if (type === "deal") {
        if (action === "add") {
          await savedMealsCol.updateOne(
            { email: normalizedEmail, dealId: id },
            { $set: { email: normalizedEmail, dealId: id } },
            { upsert: true }
          )
        } else {
          await savedMealsCol.deleteOne({ email: normalizedEmail, dealId: id })
        }
      } else {
        if (action === "add") {
          await favoriteStoresCol.updateOne(
            { email: normalizedEmail, storeId: id },
            { $set: { email: normalizedEmail, storeId: id } },
            { upsert: true }
          )
        } else {
          await favoriteStoresCol.deleteOne({ email: normalizedEmail, storeId: id })
        }
      }

      const latest = await fallbackCol.findOne({ email: normalizedEmail })
      return NextResponse.json({ ok: true, favorites: sanitizeFavorites(latest?.favorites) })
    }

    if (isProduction) {
      return NextResponse.json({ error: "Favorites storage belum dikonfigurasi" }, { status: 503 })
    }

    const all = await readFile()
    let current = sanitizeFavorites(all[normalizedEmail])

    const users = await readJsonFile<any[]>("users.json", [])
    const userIdx = users.findIndex((u) => String(u.email || "").trim().toLowerCase() === normalizedEmail)
    if (userIdx >= 0) {
      current = sanitizeFavorites(users[userIdx].favorites)
    }

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

    if (userIdx >= 0) {
      users[userIdx].favorites = current
      await writeJsonFile("users.json", users)
    }

    return NextResponse.json({ ok: true, favorites: current })
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  } finally {
    if (client) await client.close()
  }
}
