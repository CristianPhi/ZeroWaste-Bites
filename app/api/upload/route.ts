import { NextResponse } from "next/server"
import { mkdir, writeFile } from "fs/promises"
import path from "path"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_")
}

function isAllowedImage(file: File) {
  const allowedMime = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/jpg",
    "image/pjpeg",
    "image/avif",
  ]
  const allowedExt = [".jpg", ".jpeg", ".png", ".webp", ".jfif", ".avif"]
  const lowerName = String(file.name || "").toLowerCase()
  const byMime = allowedMime.includes(String(file.type || "").toLowerCase())
  const byExt = allowedExt.some((ext) => lowerName.endsWith(ext))
  return byMime || byExt
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "File required" }, { status: 400 })
    }

    if (!isAllowedImage(file)) {
      return NextResponse.json(
        { error: "Format file belum didukung. Gunakan JPG, PNG, WEBP, JFIF, atau AVIF." },
        { status: 400 }
      )
    }

    const maxBytes = 8 * 1024 * 1024
    if (file.size > maxBytes) {
      return NextResponse.json(
        { error: "Ukuran file terlalu besar. Maksimal 8MB." },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    try {
      const uploadDir = path.join(process.cwd(), "public", "uploads")
      await mkdir(uploadDir, { recursive: true })

      const safeName = sanitizeFileName(file.name || "upload.jpg")
      const finalName = `${Date.now()}_${safeName}`
      const fullPath = path.join(uploadDir, finalName)

      await writeFile(fullPath, buffer)
      return NextResponse.json({ ok: true, url: `/uploads/${finalName}` })
    } catch {
      const mime = String(file.type || "image/jpeg")
      const base64 = buffer.toString("base64")
      const dataUrl = `data:${mime};base64,${base64}`
      return NextResponse.json({ ok: true, url: dataUrl, mode: "inline" })
    }
  } catch (err: any) {
    return NextResponse.json({ error: "Upload failed", detail: err?.message || "Unknown error" }, { status: 500 })
  }
}
