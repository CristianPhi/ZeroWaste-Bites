export async function getSavedMoney(email: string) {
  const normalizedEmail = email.trim().toLowerCase()
  try {
    const res = await fetch(`/api/saved-money?email=${encodeURIComponent(normalizedEmail)}`, {
      cache: "no-store",
    })
    if (!res.ok) return { totalSaved: 0, records: 0 }
    const data = await res.json()
    return data
  } catch {
    return { totalSaved: 0, records: 0 }
  }
}

export async function logSavedMoney(
  email: string,
  dealId: string,
  amountSaved: number,
  storeName?: string,
  itemName?: string
) {
  const normalizedEmail = email.trim().toLowerCase()
  try {
    const res = await fetch(`/api/saved-money`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: normalizedEmail,
        dealId,
        amountSaved,
        storeName,
        itemName,
      }),
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}
