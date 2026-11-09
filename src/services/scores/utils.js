/** Conserva solo la mejor entrada de cada apodo (lista ya ordenada desc). */
export function bestPerPlayer(sortedRows) {
  const seen = new Set()
  return sortedRows.filter((r) => {
    const key = r.nickname.trim().toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function newId() {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID()
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}
