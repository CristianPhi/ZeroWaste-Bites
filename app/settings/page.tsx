"use client"

import Link from "next/link"
import { useTheme } from "next-themes"
import { Moon, Sun } from "lucide-react"
import { AppLogo } from "@/components/app-logo"

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const isDark = theme === "dark"

  return (
    <main className="w-full px-4 py-8">
      <header className="mb-6">
        <Link href="/" aria-label="Go to Feed">
          <AppLogo alt="ZeroWaste Bites" className="h-16 w-auto" priority />
        </Link>
      </header>

      <section className="mx-auto w-full max-w-xl rounded-2xl border border-border bg-card p-5 shadow-sm">
        <h2 className="text-base font-semibold text-foreground">Appearance</h2>
        <p className="mt-1 text-sm text-muted-foreground">Pilih tema aplikasi yang paling nyaman buat kamu.</p>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setTheme("light")}
            className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${
              !isDark ? "border-primary bg-primary/10 text-primary" : "border-border bg-secondary/40 text-foreground"
            }`}
          >
            <Sun className="h-4 w-4" />
            Light Mode
          </button>
          <button
            type="button"
            onClick={() => setTheme("dark")}
            className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${
              isDark ? "border-primary bg-primary/10 text-primary" : "border-border bg-secondary/40 text-foreground"
            }`}
          >
            <Moon className="h-4 w-4" />
            Dark Mode
          </button>
        </div>
      </section>
    </main>
  )
}
