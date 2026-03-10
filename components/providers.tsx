"use client"

import { StudentProvider } from "@/lib/student-context"
import type { ReactNode } from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { ThemeToggle } from "@/components/theme-toggle"

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <StudentProvider>
        {children}
        <ThemeToggle />
      </StudentProvider>
    </ThemeProvider>
  )
}
