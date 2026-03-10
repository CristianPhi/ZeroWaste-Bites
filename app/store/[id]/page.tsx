import { StoreDetailContent } from "@/components/store-detail-content"

export default async function StoreDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <main className="min-h-screen w-full bg-background">
      <StoreDetailContent storeId={id} />
    </main>
  )
}
