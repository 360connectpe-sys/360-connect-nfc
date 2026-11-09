export function newId() {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID()
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`
}

// Sin caracteres ambiguos (0/O, 1/I/L) para dictarlo o leerlo sin errores.
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

function randomChars(n) {
  const bytes = new Uint8Array(n)
  crypto.getRandomValues(bytes)
  return [...bytes].map((b) => ALPHABET[b % ALPHABET.length]).join('')
}

/** Código de premio de un solo uso, ej. "CN-7K4Q-X9MD". */
export const makePrizeCode = (prefix) => `${prefix}-${randomChars(4)}-${randomChars(4)}`

/** Código temporal de sala multijugador, ej. "K7Q4M". */
export const makeRoomCode = () => randomChars(5)

export const normalizeCode = (code) => String(code ?? '').toUpperCase().replace(/[^A-Z0-9-]/g, '').trim()
export const maskCode = (code) => code.replace(/^(\w+-\w{2})\w{2}-\w{4}$/, '$1••-••••')
