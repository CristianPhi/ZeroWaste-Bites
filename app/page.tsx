"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { BottomNav } from "@/components/bottom-nav"
import { HomeContent } from "@/components/home-content"
import { useStudent } from "@/lib/student-context"

export default function HomePage() {
  const { user } = useStudent()
  const router = useRouter()

  useEffect(() => {
    if (!user) {
      router.push("/auth/login")
      return
    }

    if (user.role === "store_owner") {
      router.push("/admin")
    }
  }, [user, router])

  if (!user || user.role === "store_owner") return null

  return (
    <main className="min-h-screen w-full bg-background">
      <HomeContent />
      <BottomNav />
    </main>
  )
}
