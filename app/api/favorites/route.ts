import { NextResponse } from "next/server"
import { readJsonFile, writeJsonFile } from "@/lib/storage"

type Favorites = {
  savedDeals: string[]
  favoriteStores: string[]
}

const FILE_NAME = "favorites.json"

async function readFile(): Promise<Record<string, Favorites>> {
  const data = await readJsonFile<{ favorites?: Record<string, Favorites> }>(FILE_NAME, { favorites: {} })
  return data.favorites || {}
}

async function writeFile(favs: Record<string, Favorites>) {
  const payload = { favorites: favs }
  await writeJsonFile(FILE_NAME, payload)
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const email = url.searchParams.get("email")
    if (!email) return NextResponse.json({ error: "email required" }, { status: 400 })

    const all = await readFile()
    const fav = all[email] ?? { savedDeals: [], favoriteStores: [] }
    return NextResponse.json({ ok: true, favorites: fav })
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
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

    const all = await readFile()
    const current = all[email] ?? { savedDeals: [], favoriteStores: [] }

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

    all[email] = current
    await writeFile(all)

    return NextResponse.json({ ok: true, favorites: current })
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
