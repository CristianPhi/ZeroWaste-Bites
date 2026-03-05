import { DealDetailContent } from "@/components/deal-detail-content"

export default async function DealPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl bg-background">
      <DealDetailContent dealId={id} />
    </main>
  )
}
