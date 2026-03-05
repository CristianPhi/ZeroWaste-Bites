"use client"

import { StudentProvider } from "@/lib/student-context"
import type { ReactNode } from "react"

export function Providers({ children }: { children: ReactNode }) {
  return <StudentProvider>{children}</StudentProvider>
}
