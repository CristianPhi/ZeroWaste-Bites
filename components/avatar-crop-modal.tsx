"use client"

import { useEffect, useMemo, useState } from "react"

type AvatarCropModalProps = {
  file: File
  open: boolean
  onCancel: () => void
  onConfirm: (croppedFile: File) => Promise<void> | void
}

const CROP_SIZE = 240

export function AvatarCropModal({ file, open, onCancel, onConfirm }: AvatarCropModalProps) {
  const [imageUrl, setImageUrl] = useState("")
  const [imgSize, setImgSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 })
  const [zoom, setZoom] = useState(1)
  const [offsetX, setOffsetX] = useState(0)
  const [offsetY, setOffsetY] = useState(0)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    const url = URL.createObjectURL(file)
    setImageUrl(url)
    setZoom(1)
    setOffsetX(0)
    setOffsetY(0)

    const img = new Image()
    img.onload = () => {
      setImgSize({ w: img.naturalWidth || 1, h: img.naturalHeight || 1 })
    }
    img.src = url

    return () => {
      URL.revokeObjectURL(url)
    }
  }, [file, open])

  const baseScale = useMemo(() => {
    if (!imgSize.w || !imgSize.h) return 1
    return Math.max(CROP_SIZE / imgSize.w, CROP_SIZE / imgSize.h)
  }, [imgSize])

  const finalScale = baseScale * zoom

  const handleConfirm = async () => {
    if (!imageUrl || !imgSize.w || !imgSize.h || saving) return
    setSaving(true)
    try {
      const img = await loadImage(imageUrl)
      const canvas = document.createElement("canvas")
      canvas.width = 512
      canvas.height = 512
      const ctx = canvas.getContext("2d")
      if (!ctx) throw new Error("Canvas tidak tersedia")

      const factor = canvas.width / CROP_SIZE
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.save()
      ctx.translate(canvas.width / 2 + offsetX * factor, canvas.height / 2 + offsetY * factor)
      ctx.scale(finalScale * factor, finalScale * factor)
      ctx.drawImage(img, -imgSize.w / 2, -imgSize.h / 2)
      ctx.restore()

      const blob = await canvasToBlob(canvas, "image/webp", 0.95)
      const safeName = file.name.replace(/\.[^.]+$/, "") || "avatar"
      const cropped = new File([blob], `${safeName}-avatar.webp`, { type: "image/webp" })
      await onConfirm(cropped)
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-80 flex items-center justify-center bg-foreground/60 px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-4 shadow-2xl">
        <h3 className="text-base font-semibold text-foreground">Trim Profile Picture</h3>
        <p className="mt-1 text-xs text-muted-foreground">Geser posisi dan zoom sesuai keinginan.</p>

        <div className="mt-4 flex items-center justify-center">
          <div
            className="relative overflow-hidden rounded-full ring-2 ring-primary/30"
            style={{ width: CROP_SIZE, height: CROP_SIZE }}
          >
            {imageUrl ? (
              <img
                src={imageUrl}
                alt="Avatar preview"
                draggable={false}
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  width: `${imgSize.w * finalScale}px`,
                  height: `${imgSize.h * finalScale}px`,
                  transform: `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px))`,
                  userSelect: "none",
                }}
              />
            ) : null}
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <label className="block text-xs text-muted-foreground">
            Zoom
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="mt-1 w-full"
            />
          </label>

          <label className="block text-xs text-muted-foreground">
            Geser Horizontal
            <input
              type="range"
              min={-140}
              max={140}
              step={1}
              value={offsetX}
              onChange={(e) => setOffsetX(Number(e.target.value))}
              className="mt-1 w-full"
            />
          </label>

          <label className="block text-xs text-muted-foreground">
            Geser Vertikal
            <input
              type="range"
              min={-140}
              max={140}
              step={1}
              value={offsetY}
              onChange={(e) => setOffsetY(Number(e.target.value))}
              className="mt-1 w-full"
            />
          </label>
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-input px-3 py-2 text-sm"
            disabled={saving}
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
            disabled={saving}
          >
            {saving ? "Menyimpan..." : "Pakai Foto Ini"}
          </button>
        </div>
      </div>
    </div>
  )
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error("Gagal memuat gambar"))
    img.src = url
  })
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Gagal memproses gambar"))
        return
      }
      resolve(blob)
    }, type, quality)
  })
}
