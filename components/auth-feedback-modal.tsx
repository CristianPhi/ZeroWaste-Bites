"use client"

import React from "react"
import { Check, CircleAlert } from "lucide-react"

type AuthFeedbackModalProps = {
  open: boolean
  title: string
  description: string
  type: "success" | "error"
  onClose: () => void
}

export function AuthFeedbackModal({ open, title, description, type, onClose }: AuthFeedbackModalProps) {
  if (!open) return null

  const isSuccess = type === "success"

  return (
    <div className="fixed inset-0 z-120 flex items-center justify-center bg-black/50 px-4" role="dialog" aria-modal="true" aria-live="polite">
      <div className="w-full max-w-sm rounded-2xl border bg-background p-6 text-center shadow-2xl animate-in fade-in-0 zoom-in-95 duration-200">
        <div className={`mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full ${isSuccess ? "bg-emerald-500/15 text-emerald-500" : "bg-red-500/15 text-red-500"}`}>
          <span className={`absolute h-16 w-16 animate-ping rounded-full ${isSuccess ? "bg-emerald-500/20" : "bg-red-500/20"}`} />
          {isSuccess ? <Check className="relative h-8 w-8" /> : <CircleAlert className="relative h-8 w-8" />}
        </div>

        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>

        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground hover:bg-primary/90"
        >
          OK
        </button>
      </div>
    </div>
  )
}