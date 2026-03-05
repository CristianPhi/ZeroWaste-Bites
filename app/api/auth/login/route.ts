import { NextResponse } from "next/server"
import { readJsonFile } from "@/lib/storage"

type User = { id: string; name: string; email: string; password: string }

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email, password } = body as Partial<User>
    if (!email || !password) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 })
    }

    const users = await readJsonFile<User[]>("users.json", [])

    const user = users.find((u) => u.email === email && u.password === password)
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const { password: _p, ...out } = user
    return NextResponse.json(out)
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
