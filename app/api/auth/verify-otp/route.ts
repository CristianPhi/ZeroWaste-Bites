import { NextResponse } from "next/server"
import { readJsonFile, writeJsonFile } from "@/lib/storage"

type Otp = { phone: string; code: string; expiresAt: number }
type User = { id: string; name: string; email: string; password?: string; phone?: string }

export async function POST(req: Request) {
  try {
    const body = await req.json()
    // Accept either phone+code or email+code
    let phone: string | undefined = body.phone
    const email: string | undefined = body.email
    const code: string | undefined = body.code
    if (!code) return NextResponse.json({ error: "Missing fields" }, { status: 400 })

    if (!phone && email) {
      const users = await readJsonFile<User[]>("users.json", [])
      const user = users.find((u) => u.email === email)
      if (!user || !user.phone) return NextResponse.json({ error: "No phone for this user" }, { status: 404 })
      phone = user.phone
    }

    if (!phone) return NextResponse.json({ error: "Phone required" }, { status: 400 })

    const otps = await readJsonFile<Otp[]>("otps.json", [])
    const found = otps.find((o) => o.phone === phone && o.code === code)
    if (!found) return NextResponse.json({ error: "Invalid code" }, { status: 401 })
    if (Date.now() > found.expiresAt) return NextResponse.json({ error: "Code expired" }, { status: 410 })

    // Remove used OTP
    const remaining = otps.filter((o) => !(o.phone === phone && o.code === code))
    await writeJsonFile("otps.json", remaining)

    // Find user by phone
    const users = await readJsonFile<User[]>("users.json", [])
    const user = users.find((u) => u.phone === phone)
    if (!user) return NextResponse.json({ error: "User not found for this phone" }, { status: 404 })

    const { password: _p, ...out } = user
    return NextResponse.json(out)
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
