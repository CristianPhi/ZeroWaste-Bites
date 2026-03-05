export function isDealClaimed(id: string): boolean {
  if (typeof window === "undefined") return false
  try {
    return localStorage.getItem(`claimed:${id}`) === "true"
  } catch {
    return false
  }
}

export function setDealClaimed(id: string) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(`claimed:${id}`, "true")
  } catch {
    // ignore
  }
}
