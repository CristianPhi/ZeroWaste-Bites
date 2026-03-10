import Link from "next/link"
import { AppLogo } from "@/components/app-logo"

export default function AboutPage() {
  return (
    <main className="w-full px-4 py-8">
      <header className="mb-6">
        <Link href="/" aria-label="Go to Feed">
          <AppLogo alt="ZeroWaste Bites" className="h-16 w-auto" priority />
        </Link>
      </header>

      <section className="mx-auto w-full max-w-2xl rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-muted-foreground text-sm font-semibold text-muted-foreground">
            i
          </span>
          <h2 className="text-lg font-semibold text-foreground">About Us</h2>
        </div>

        <p className="text-sm leading-relaxed text-muted-foreground">
          ZeroWaste Bites membantu pengguna menemukan makanan surplus berkualitas dengan harga lebih hemat,
          sambil mengurangi food waste dari toko dan UMKM sekitar.
        </p>

        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Misi kami adalah membuat kebiasaan menyelamatkan makanan jadi lebih mudah, terjangkau, dan berdampak untuk lingkungan.
        </p>
      </section>
    </main>
  )
}
