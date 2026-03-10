import { BottomNav } from "@/components/bottom-nav"
import { OrdersContent } from "@/components/orders-content"

export default function OrdersPage() {
  return (
    <main className="min-h-screen w-full bg-background">
      <div className="px-4 pb-24 pt-6">
        <OrdersContent />
      </div>
      <BottomNav />
    </main>
  )
}
