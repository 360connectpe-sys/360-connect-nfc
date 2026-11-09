/**
 * TRANSPORTE DE MENSAJES PARA SALAS MULTIJUGADOR
 * ------------------------------------------------------------------
 * Interfaz común: { kind, send(msg), subscribe(fn) -> unsubscribe, close() }
 *
 * - Local (demo):   BroadcastChannel → solo entre pestañas/ventanas del
 *                   MISMO navegador en el MISMO dispositivo.
 * - Supabase:       Realtime Broadcast → entre celulares distintos por internet.
 *
 * Los canales incluyen el id del restaurante, así las salas de un
 * restaurante nunca se mezclan con las de otro.
 */
export function createLocalTransport(channelName) {
  if (typeof BroadcastChannel === 'undefined') throw new Error('Este navegador no soporta salas en modo demo')
  const bc = new BroadcastChannel(channelName)
  const subs = new Set()
  bc.onmessage = (e) => subs.forEach((fn) => fn(e.data))
  return {
    kind: 'local',
    send: (msg) => bc.postMessage(msg),
    subscribe: (fn) => {
      subs.add(fn)
      return () => subs.delete(fn)
    },
    close: () => {
      subs.clear()
      bc.close()
    },
  }
}

export async function createSupabaseTransport(client, channelName) {
  const channel = client.channel(channelName, { config: { broadcast: { self: false, ack: false } } })
  const subs = new Set()
  channel.on('broadcast', { event: 'm' }, ({ payload }) => subs.forEach((fn) => fn(payload)))
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('No se pudo conectar al servidor de salas')), 8000)
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        clearTimeout(timer)
        resolve()
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        clearTimeout(timer)
        reject(new Error('Error de conexión con la sala'))
      }
    })
  })
  return {
    kind: 'supabase',
    send: (msg) => channel.send({ type: 'broadcast', event: 'm', payload: msg }),
    subscribe: (fn) => {
      subs.add(fn)
      return () => subs.delete(fn)
    },
    close: () => {
      subs.clear()
      client.removeChannel(channel)
    },
  }
}
