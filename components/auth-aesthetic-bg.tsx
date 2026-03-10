import { Apple, Croissant, UtensilsCrossed } from "lucide-react"

export function AuthAestheticBg() {
  return (
    <>
      <div className="pointer-events-none fixed inset-0 -z-20 bg-[radial-gradient(circle_at_15%_15%,rgba(16,185,129,0.08),transparent_32%),radial-gradient(circle_at_80%_10%,rgba(120,113,108,0.12),transparent_34%),radial-gradient(circle_at_85%_80%,rgba(34,197,94,0.06),transparent_28%)]" />
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[linear-gradient(rgba(120,113,108,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(120,113,108,0.06)_1px,transparent_1px)] bg-size-[36px_36px] mask-[radial-gradient(circle_at_center,black,transparent_78%)]" />

      <div className="pointer-events-none fixed left-[8%] top-[18%] -z-10 rounded-full border border-emerald-700/20 bg-emerald-500/5 p-3 text-emerald-700/30">
        <Apple className="h-8 w-8" />
      </div>
      <div className="pointer-events-none fixed right-[10%] top-[24%] -z-10 rounded-full border border-stone-500/20 bg-stone-400/5 p-3 text-stone-700/30">
        <UtensilsCrossed className="h-8 w-8" />
      </div>
      <div className="pointer-events-none fixed bottom-[16%] left-[14%] -z-10 rounded-full border border-emerald-700/20 bg-emerald-500/5 p-3 text-emerald-700/30">
        <Croissant className="h-8 w-8" />
      </div>
    </>
  )
}
