import { DealDetailContent } from "@/components/deal-detail-content"

export default async function DealPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  return (
    <main className="min-h-screen w-full bg-background">
      <DealDetailContent dealId={id} />
    </main>
  )
}
