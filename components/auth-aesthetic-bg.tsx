"use client"

import { Apple, Croissant, UtensilsCrossed } from "lucide-react"
import { usePathname } from "next/navigation"

export function AuthAestheticBg() {
  const pathname = usePathname()
  const isAuthPage = pathname.startsWith("/auth")
  const isAuthFocus = pathname === "/auth/login" || pathname === "/auth/register"

  return (
    <>
      <div
        className={`pointer-events-none fixed inset-0 -z-20 ${
          isAuthFocus
            ? "bg-[radial-gradient(circle_at_15%_15%,rgba(16,185,129,0.12),transparent_34%),radial-gradient(circle_at_80%_10%,rgba(120,113,108,0.16),transparent_38%),radial-gradient(circle_at_85%_80%,rgba(34,197,94,0.1),transparent_30%)] dark:bg-[radial-gradient(circle_at_15%_15%,rgba(16,185,129,0.35),transparent_34%),radial-gradient(circle_at_80%_10%,rgba(255,255,255,0.18),transparent_40%),radial-gradient(circle_at_85%_80%,rgba(34,197,94,0.28),transparent_34%)]"
            : "bg-[radial-gradient(circle_at_15%_15%,rgba(16,185,129,0.03),transparent_34%),radial-gradient(circle_at_80%_10%,rgba(120,113,108,0.04),transparent_38%),radial-gradient(circle_at_85%_80%,rgba(34,197,94,0.025),transparent_30%)] dark:bg-[radial-gradient(circle_at_15%_15%,rgba(16,185,129,0.12),transparent_34%),radial-gradient(circle_at_80%_10%,rgba(255,255,255,0.06),transparent_40%),radial-gradient(circle_at_85%_80%,rgba(34,197,94,0.09),transparent_34%)]"
        }`}
      />
      <div
        className={`pointer-events-none fixed inset-0 -z-10 bg-[linear-gradient(rgba(120,113,108,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(120,113,108,0.08)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-size-[36px_36px] mask-[radial-gradient(circle_at_center,black,transparent_78%)] ${
          isAuthFocus ? "opacity-100 dark:opacity-95" : "opacity-15 dark:opacity-25"
        }`}
      />

      {isAuthPage ? (
        <>
          <div className={`pointer-events-none fixed left-[8%] top-[18%] -z-10 rounded-full border p-3 shadow-[0_0_0_1px_rgba(0,0,0,0.02)] ${isAuthFocus ? "border-stone-500/35 bg-stone-200/25 text-stone-700/55 dark:border-white/45 dark:bg-white/10 dark:text-white/90 dark:shadow-[0_0_35px_rgba(34,197,94,0.35)]" : "border-stone-400/25 bg-stone-200/15 text-stone-600/40 dark:border-white/25 dark:bg-white/5 dark:text-white/65 dark:shadow-[0_0_18px_rgba(34,197,94,0.2)]"}`}>
            <Apple className="h-8 w-8" />
          </div>
          <div className={`pointer-events-none fixed right-[10%] top-[24%] -z-10 rounded-full border p-3 shadow-[0_0_0_1px_rgba(0,0,0,0.02)] ${isAuthFocus ? "border-stone-500/35 bg-stone-200/25 text-stone-700/55 dark:border-white/45 dark:bg-white/10 dark:text-white/90 dark:shadow-[0_0_35px_rgba(34,197,94,0.35)]" : "border-stone-400/25 bg-stone-200/15 text-stone-600/40 dark:border-white/25 dark:bg-white/5 dark:text-white/65 dark:shadow-[0_0_18px_rgba(34,197,94,0.2)]"}`}>
            <UtensilsCrossed className="h-8 w-8" />
          </div>
          <div className={`pointer-events-none fixed bottom-[16%] left-[14%] -z-10 rounded-full border p-3 shadow-[0_0_0_1px_rgba(0,0,0,0.02)] ${isAuthFocus ? "border-stone-500/35 bg-stone-200/25 text-stone-700/55 dark:border-white/45 dark:bg-white/10 dark:text-white/90 dark:shadow-[0_0_35px_rgba(34,197,94,0.35)]" : "border-stone-400/25 bg-stone-200/15 text-stone-600/40 dark:border-white/25 dark:bg-white/5 dark:text-white/65 dark:shadow-[0_0_18px_rgba(34,197,94,0.2)]"}`}>
            <Croissant className="h-8 w-8" />
          </div>
        </>
      ) : null}
    </>
  )
}
