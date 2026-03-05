import { NextResponse } from "next/server"
import { writeJsonFile } from "@/lib/storage"

export async function POST() {
  try {
    await writeJsonFile("users.json", [])
    await writeJsonFile("otps.json", [])
    await writeJsonFile("payments.json", { payments: [] })
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to clear db' }, { status: 500 })
  }
}
