export async function getFavorites(email: string) {
  try {
    const res = await fetch(`/api/favorites?email=${encodeURIComponent(email)}`)
    if (!res.ok) return { savedDeals: [], favoriteStores: [] }
    const data = await res.json()
    return data.favorites || { savedDeals: [], favoriteStores: [] }
  } catch {
    return { savedDeals: [], favoriteStores: [] }
  }
}

export async function addFavorite(email: string, type: "deal" | "store", id: string) {
  try {
    const res = await fetch(`/api/favorites`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, action: "add", type: type === "deal" ? "deal" : "store", id }),
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export async function removeFavorite(email: string, type: "deal" | "store", id: string) {
  try {
    const res = await fetch(`/api/favorites`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, action: "remove", type: type === "deal" ? "deal" : "store", id }),
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}
