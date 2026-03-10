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
  password: string
  phone?: string
  favorites?: { savedDeals: string[]; favoriteStores: string[] }
}

function normalizeUsername(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "")
}

export async function POST(req: Request) {
  let client
  try {
    const body = await req.json()
    const action = String(body?.action || "").trim()
    const email = String(body?.email || "").trim().toLowerCase()
    const username = String(body?.username || "").trim()
    const currentPassword = String(body?.currentPassword || "")
    const confirmCurrentPassword = String(body?.confirmCurrentPassword || "")
    const newPassword = String(body?.newPassword || "")
    const confirmNewPassword = String(body?.confirmNewPassword || "")

    if (!email) {
      return NextResponse.json({ error: "Email wajib diisi" }, { status: 400 })
    }

    if (action !== "change_username" && action !== "change_password") {
      return NextResponse.json({ error: "Action tidak valid" }, { status: 400 })
    }

    const usernameNormalized = username ? normalizeUsername(username) : ""
    if (action === "change_username") {
      if (!usernameNormalized || usernameNormalized.length < 3) {
        return NextResponse.json({ error: "Username minimal 3 karakter" }, { status: 400 })
      }
      if (!currentPassword || !confirmCurrentPassword) {
        return NextResponse.json({ error: "Password sekarang dan konfirmasi wajib diisi" }, { status: 400 })
      }
      if (currentPassword !== confirmCurrentPassword) {
        return NextResponse.json({ error: "Konfirmasi password sekarang tidak sama" }, { status: 400 })
      }
    }

    if (action === "change_password") {
      if (!currentPassword || !newPassword || !confirmNewPassword) {
        return NextResponse.json({ error: "Password lama, baru, dan konfirmasi wajib diisi" }, { status: 400 })
      }
      if (newPassword !== confirmNewPassword) {
        return NextResponse.json({ error: "Konfirmasi password baru tidak sama" }, { status: 400 })
      }
      if (currentPassword === newPassword) {
        return NextResponse.json({ error: "Password baru harus berbeda" }, { status: 400 })
      }
    }

    if (hasMongoConfig()) {
      const mongo = await connectMongo()
      client = mongo.client
      const usersCol = mongo.db.collection("users")

      const user = await usersCol.findOne({ email })
      if (!user) {
        return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 })
      }

      if (action === "change_username" && usernameNormalized !== String(user.username || "")) {
        const usernameUsed = await usersCol.findOne({ username: usernameNormalized, email: { $ne: email } })
        if (usernameUsed) {
          return NextResponse.json({ error: "Username sudah dipakai" }, { status: 409 })
        }
      }

      if (String(user.password || "") !== currentPassword) {
        return NextResponse.json({ error: "Password saat ini salah" }, { status: 400 })
      }

      const updatePayload: any = {}
      if (action === "change_username") updatePayload.username = usernameNormalized
      if (action === "change_password") updatePayload.password = newPassword

      if (Object.keys(updatePayload).length > 0) {
        await usersCol.updateOne({ email }, { $set: updatePayload })
      }

      const latestUser = await usersCol.findOne({ email }, { projection: { password: 0 } })
      return NextResponse.json({ ok: true, user: latestUser })
    }

    const users = await readJsonFile<UserRecord[]>("users.json", [])
    const idx = users.findIndex((u) => String(u.email || "").trim().toLowerCase() === email)
    if (idx < 0) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 })
    }

    const current = users[idx]
    if (action === "change_username" && usernameNormalized !== String(current.username || "")) {
      const usernameUsed = users.some((u, i) => i !== idx && normalizeUsername(String(u.username || "")) === usernameNormalized)
      if (usernameUsed) {
        return NextResponse.json({ error: "Username sudah dipakai" }, { status: 409 })
      }
    }

    if (String(current.password || "") !== currentPassword) {
      return NextResponse.json({ error: "Password saat ini salah" }, { status: 400 })
    }

    if (action === "change_password") {
      current.password = newPassword
    }

    if (action === "change_username") current.username = usernameNormalized

    users[idx] = current
    await writeJsonFile("users.json", users)

    const { password: _pw, ...safeUser } = current
    return NextResponse.json({ ok: true, user: safeUser })
  } catch (err: any) {
    return NextResponse.json({ error: "Server error", detail: err?.message || "Unknown error" }, { status: 500 })
  } finally {
    if (client) await client.close()
  }
}
