"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

interface StudentContextType {
  isVerified: boolean
  setVerified: (v: boolean) => void
  user: { id: string; name: string; email: string } | null
  setUser: (u: { id: string; name: string; email: string } | null) => void
}

const StudentContext = createContext<StudentContextType>({
  isVerified: false,
  setVerified: () => {},
  user: null,
  setUser: () => {},
})

export function StudentProvider({ children }: { children: ReactNode }) {
  const [isVerified, setVerifiedState] = useState<boolean>(() => {
    if (typeof window === "undefined") return false
    try {
      return localStorage.getItem("isVerified") === "true"
    } catch {
      return false
    }
  })

  const [user, setUserState] = useState<{ id: string; name: string; email: string } | null>(() => {
    if (typeof window === "undefined") return null
    try {
      const rawLocal = localStorage.getItem("user")
      if (rawLocal) return JSON.parse(rawLocal)
      const rawSession = sessionStorage.getItem("user")
      return rawSession ? JSON.parse(rawSession) : null
    } catch {
      return null
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem("isVerified", isVerified ? "true" : "false")
    } catch {
      // ignore
    }
  }, [isVerified])

  useEffect(() => {
    try {
      if (user) {
        const rememberMe = localStorage.getItem("rememberMe") === "true"
        if (rememberMe) {
          localStorage.setItem("user", JSON.stringify(user))
          sessionStorage.removeItem("user")
        } else {
          sessionStorage.setItem("user", JSON.stringify(user))
          localStorage.removeItem("user")
        }
      } else {
        localStorage.removeItem("user")
        sessionStorage.removeItem("user")
      }
    } catch {
      // ignore
    }
  }, [user])

  function setVerified(v: boolean) {
    setVerifiedState(v)
  }

  function setUser(u: { id: string; name: string; email: string } | null) {
    setUserState(u)
    if (!u) {
      // logging out clears verified
      setVerifiedState(false)
    }
  }

  return (
    <StudentContext.Provider value={{ isVerified, setVerified, user, setUser }}>
      {children}
    </StudentContext.Provider>
  )
}

export function useStudent() {
  return useContext(StudentContext)
}

export function getStudentPrice(discountedPrice: number): number {
  return Math.round(discountedPrice * 0.8)

}
