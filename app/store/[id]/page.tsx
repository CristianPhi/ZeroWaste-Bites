import { StoreDetailContent } from "@/components/store-detail-content"

export default async function StoreDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl bg-background">
      <StoreDetailContent storeId={id} />
    </main>
  )
}
