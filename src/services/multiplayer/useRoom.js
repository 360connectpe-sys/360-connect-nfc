import { useCallback, useEffect, useRef, useState } from 'react'
import { backend } from '../backend'
import { makeRoomCode, normalizeCode } from '../backend/ids'
import { randomSeed } from '../../lib/rng'

/**
 * SALAS PRIVADAS POR CÓDIGO (sin mesas)
 * ------------------------------------------------------------------
 * El ANFITRIÓN crea la sala y es la autoridad: acepta/rechaza jugadores,
 * mantiene la lista, decide el inicio y la semilla de la partida.
 *
 * Protocolo (mensajes { type, from, payload }):
 *   hello      invitado → anfitrión   quiero entrar
 *   roster     anfitrión → todos      lista de jugadores + fase
 *   reject     anfitrión → invitado   sala llena / partida en curso
 *   ready      cualquiera             marca listo / no listo
 *   start      anfitrión → todos      { seed } inicio sincronizado
 *   lobby      anfitrión → todos      volver a la sala (revancha)
 *   hb         todos (cada 2 s)       latido; sin latidos 7 s = desconectado
 *   leave      cualquiera             salida voluntaria
 *   (otros)    mensajes del juego → se reenvían a los suscriptores
 */
const COLORS = ['#ff6b8b', '#5eead4', '#ffb547', '#a78bfa']
const HEARTBEAT_MS = 2000
const TIMEOUT_MS = 7000
const JOIN_TIMEOUT_MS = 4000

export function useRoom({ gameId, me, maxPlayers }) {
  const [room, setRoom] = useState({ status: 'idle', code: null, isHost: false, players: [], phase: 'lobby', seed: null, error: null })
  const transport = useRef(null)
  const unsub = useRef(null)
  const listeners = useRef(new Set())
  const lastSeen = useRef({})
  const stateRef = useRef(room)
  stateRef.current = room

  const update = (patch) => setRoom((r) => ({ ...r, ...patch }))
  const emit = (msg) => listeners.current.forEach((fn) => fn(msg))
  const send = useCallback((type, payload = {}) => transport.current?.send({ type, from: me.id, game: gameId, payload }), [me.id, gameId])

  const cleanup = useCallback(() => {
    unsub.current?.()
    transport.current?.close()
    transport.current = null
    unsub.current = null
    lastSeen.current = {}
  }, [])

  // --- lógica del anfitrión ---
  const hostBroadcastRoster = (players, phase = stateRef.current.phase) => {
    update({ players, phase })
    send('roster', { players, phase, hostId: me.id })
  }

  const handle = (msg) => {
    if (!msg || msg.game !== gameId || msg.from === me.id) return
    if (msg.payload?.to && msg.payload.to !== me.id) return
    lastSeen.current[msg.from] = Date.now()
    const r = stateRef.current

    if (r.isHost) {
      if (msg.type === 'hello') {
        const exists = r.players.some((p) => p.id === msg.from)
        if (!exists && (r.players.length >= maxPlayers || r.phase !== 'lobby')) {
          send('reject', { to: msg.from, reason: r.phase !== 'lobby' ? 'La partida ya comenzó' : 'La sala está llena' })
          return
        }
        const players = exists
          ? r.players
          : [...r.players, { id: msg.from, name: msg.payload.name, color: COLORS.find((c) => !r.players.some((p) => p.color === c)), ready: false }]
        hostBroadcastRoster(players)
        return
      }
      if (msg.type === 'ready') {
        hostBroadcastRoster(r.players.map((p) => (p.id === msg.from ? { ...p, ready: !!msg.payload.ready } : p)))
        return
      }
      if (msg.type === 'leave') {
        dropPlayer(msg.from)
        return
      }
    } else {
      if (msg.type === 'roster') {
        update({ status: 'joined', players: msg.payload.players, phase: msg.payload.phase, hostId: msg.payload.hostId, error: null })
        return
      }
      if (msg.type === 'reject') {
        cleanup()
        update({ status: 'error', error: msg.payload.reason })
        return
      }
      if (msg.type === 'start') {
        update({ phase: 'playing', seed: msg.payload.seed, players: msg.payload.players })
        emit({ type: 'start', payload: msg.payload })
        return
      }
      if (msg.type === 'lobby') {
        update({ phase: 'lobby', players: msg.payload.players, seed: null })
        emit(msg)
        return
      }
      if (msg.type === 'leave' && msg.from === r.hostId) {
        cleanup()
        update({ status: 'error', error: 'El anfitrión cerró la sala' })
        emit({ type: 'host-left' })
        return
      }
    }
    if (msg.type !== 'hb') emit(msg)
  }

  const dropPlayer = (id) => {
    const r = stateRef.current
    if (!r.players.some((p) => p.id === id)) return
    const players = r.players.filter((p) => p.id !== id)
    hostBroadcastRoster(players)
    emit({ type: 'player-left', from: id })
  }

  // Latidos y detección de desconexión
  useEffect(() => {
    if (room.status !== 'hosting' && room.status !== 'joined') return
    const t = setInterval(() => {
      send('hb')
      const r = stateRef.current
      const now = Date.now()
      if (r.isHost) {
        r.players.filter((p) => p.id !== me.id && now - (lastSeen.current[p.id] ?? now) > TIMEOUT_MS).forEach((p) => dropPlayer(p.id))
      } else if (r.hostId && now - (lastSeen.current[r.hostId] ?? now) > TIMEOUT_MS) {
        cleanup()
        update({ status: 'error', error: 'Se perdió la conexión con el anfitrión' })
        emit({ type: 'host-left' })
      }
    }, HEARTBEAT_MS)
    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room.status])

  useEffect(() => () => {
    send('leave')
    cleanup()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const connect = async (code) => {
    cleanup()
    transport.current = await backend.createRoomTransport(`${gameId}:${code}`)
    unsub.current = transport.current.subscribe(handle)
  }

  const create = async () => {
    const code = makeRoomCode()
    update({ status: 'connecting', error: null })
    try {
      await connect(code)
      const players = [{ id: me.id, name: me.name, color: COLORS[0], ready: false }]
      setRoom({ status: 'hosting', code, isHost: true, players, phase: 'lobby', seed: null, error: null, hostId: me.id })
    } catch (e) {
      update({ status: 'error', error: e.message })
    }
  }

  const join = async (rawCode) => {
    const code = normalizeCode(rawCode).replace(/-/g, '')
    if (code.length !== 5) return update({ status: 'error', error: 'El código tiene 5 caracteres' })
    setRoom({ status: 'connecting', code, isHost: false, players: [], phase: 'lobby', seed: null, error: null })
    try {
      await connect(code)
      send('hello', { name: me.name })
      setTimeout(() => {
        if (stateRef.current.status === 'connecting') {
          cleanup()
          update({
            status: 'error',
            error:
              backend.kind === 'local'
                ? `No encontramos la sala ${code}. En modo demo ambas personas deben usar el mismo navegador (otra pestaña).`
                : `No encontramos la sala ${code}. Revisa el código.`,
          })
        }
      }, JOIN_TIMEOUT_MS)
    } catch (e) {
      update({ status: 'error', error: e.message })
    }
  }

  const setReady = (ready) => {
    const r = stateRef.current
    if (r.isHost) hostBroadcastRoster(r.players.map((p) => (p.id === me.id ? { ...p, ready } : p)))
    else {
      update({ players: r.players.map((p) => (p.id === me.id ? { ...p, ready } : p)) })
      send('ready', { ready })
    }
  }

  const startGame = () => {
    const r = stateRef.current
    if (!r.isHost) return
    const seed = randomSeed()
    update({ phase: 'playing', seed })
    send('start', { seed, players: r.players })
    emit({ type: 'start', payload: { seed, players: r.players } })
  }

  const backToLobby = () => {
    const r = stateRef.current
    if (!r.isHost) return
    const players = r.players.map((p) => ({ ...p, ready: false }))
    update({ phase: 'lobby', seed: null, players })
    send('lobby', { players })
    emit({ type: 'lobby' })
  }

  const leave = () => {
    send('leave')
    cleanup()
    setRoom({ status: 'idle', code: null, isHost: false, players: [], phase: 'lobby', seed: null, error: null })
  }

  const subscribe = useCallback((fn) => {
    listeners.current.add(fn)
    return () => listeners.current.delete(fn)
  }, [])

  return { ...room, create, join, leave, setReady, startGame, backToLobby, send, subscribe, transportKind: backend.kind }
}
