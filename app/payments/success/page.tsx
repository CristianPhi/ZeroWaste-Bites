import Link from "next/link"
import Image from "next/image"

export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ amount?: string; status?: string }>
}) {
  const params = await searchParams
  const amount = Number(params.amount ?? 0)
  const displayAmount = amount > 0 ? `IDR ${amount.toLocaleString("id-ID")}` : null

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-12">
      <header className="mb-4">
        <Link href="/" aria-label="Go to Feed">
          <Image src="/images/Logo.png" alt="ZeroWaste Bites" width={180} height={36} className="h-16 w-auto" priority />
        </Link>
        <h1 className="mt-2 text-center text-lg font-semibold tracking-tight text-foreground">Payment Success</h1>
      </header>
      <div className="text-center">
        <h2 className="mb-2 text-2xl font-bold">Payment successful</h2>
      <p className="mb-2 text-sm text-muted-foreground">Status: Success</p>
      {displayAmount && <p className="mb-6 text-sm text-muted-foreground">Paid amount: {displayAmount}</p>}
      <Link href="/" className="rounded-md bg-primary px-4 py-2 text-white">Return to app</Link>
      </div>
    </main>
  )
}
