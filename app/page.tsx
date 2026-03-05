"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { BottomNav } from "@/components/bottom-nav"
import { HomeContent } from "@/components/home-content"
import { useStudent } from "@/lib/student-context"

export default function HomePage() {
  const { isVerified } = useStudent()
  const router = useRouter()

  useEffect(() => {
    if (!isVerified) {
      router.push("/auth/login")
    }
  }, [isVerified, router])

  if (!isVerified) return null

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl bg-background">
      <HomeContent />
      <BottomNav />
    </main>
  )
}
