import { NextResponse } from "next/server"
import { mkdir, writeFile } from "fs/promises"
import path from "path"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_")
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "File required" }, { status: 400 })
    }

    const allowed = ["image/jpeg", "image/png", "image/webp", "image/jpg"]
    if (!allowed.includes(file.type)) {
      return NextResponse.json({ error: "Only JPG/PNG/WEBP allowed" }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const uploadDir = path.join(process.cwd(), "public", "uploads")
    await mkdir(uploadDir, { recursive: true })

    const safeName = sanitizeFileName(file.name || "upload.jpg")
    const finalName = `${Date.now()}_${safeName}`
    const fullPath = path.join(uploadDir, finalName)

    await writeFile(fullPath, buffer)

    return NextResponse.json({ ok: true, url: `/uploads/${finalName}` })
  } catch (err: any) {
    return NextResponse.json({ error: "Upload failed", detail: err?.message || "Unknown error" }, { status: 500 })
  }
}
