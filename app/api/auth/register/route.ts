import { NextResponse } from "next/server"
import { readJsonFile, writeJsonFile } from "@/lib/storage"

type User = { id: string; name: string; email: string; password: string; phone?: string }

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, email, password, phone } = body as Partial<User>
    if (!name || !email || !password) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 })
    }

    const users = await readJsonFile<User[]>("users.json", [])

    if (users.find((u) => u.email === email)) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 })
    }

    const id = `user_${Date.now()}`
    const newUser: User = { id, name, email, password, phone }
    users.push(newUser)
    await writeJsonFile("users.json", users)

    const { password: _p, ...out } = newUser
    return NextResponse.json(out)
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
