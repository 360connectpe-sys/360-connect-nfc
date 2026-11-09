/**
 * SALAS POR MESA (base para juegos multijugador) — EN PREPARACIÓN
 * ------------------------------------------------------------------
 * Idea: todas las personas que escanean la placa de la Mesa 04 se unen a
 * la sala "casa-nativa:mesa-04" y comparten eventos en tiempo real
 * (respuestas de trivia, turnos, marcador del duelo, etc.).
 *
 * Implementación actual: BroadcastChannel (solo entre pestañas del MISMO
 * navegador; sirve para desarrollar y probar la lógica sin servidor).
 *
 * Producción: reemplazar createRoom por Supabase Realtime (channel por sala)
 * o Firebase Realtime Database, manteniendo la misma interfaz:
 *   const room = createRoom(roomId, player)
 *   room.send(type, payload)
 *   const off = room.on((msg) => …)
 *   room.leave()
 */

export const getTableRoomId = (restaurantId, table) => `${restaurantId}:mesa-${table}`

export function createRoom(roomId, player) {
  const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(`360c-room:${roomId}`) : null
  const listeners = new Set()

  if (channel) {
    channel.onmessage = (e) => listeners.forEach((fn) => fn(e.data))
  }

  const room = {
    id: roomId,
    send(type, payload = {}) {
      const msg = { type, payload, from: player, at: Date.now() }
      channel?.postMessage(msg)
      return msg
    },
    on(fn) {
      listeners.add(fn)
      return () => listeners.delete(fn)
    },
    leave() {
      room.send('leave')
      channel?.close()
      listeners.clear()
    },
  }
  room.send('join')
  return room
}
