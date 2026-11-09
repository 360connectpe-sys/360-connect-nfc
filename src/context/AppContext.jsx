import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { restaurant } from '../config/restaurant'
import { resolveEnabledGames } from '../config/validateConfig'
import { backend } from '../services/backend'
import { track } from '../services/analytics'

const AppContext = createContext(null)

// Enlaces antiguos de placas con ?mesa=XX: se ignoran y se limpian de la URL.
;(function stripLegacyTableParam() {
  const url = new URL(window.location.href)
  if (url.searchParams.has('mesa')) {
    url.searchParams.delete('mesa')
    window.history.replaceState(null, '', url)
  }
})()

/** Ruta basada en hash (#/menu) => compatible con GitHub Pages sin configuración. */
const readRoute = () => window.location.hash.replace(/^#\/?/, '').split('?')[0]

export function AppProvider({ children }) {
  const [route, setRoute] = useState(readRoute)
  const [toast, setToast] = useState(null)
  // undefined = cargando · null = sin registrar · objeto = jugador registrado
  const [player, setPlayer] = useState(undefined)
  const [settings, setSettings] = useState({ enabledGames: resolveEnabledGames(restaurant), prizes: restaurant.prizes })

  useEffect(() => {
    const onHash = () => {
      setRoute(readRoute())
      window.scrollTo({ top: 0 })
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => {
    backend.getCurrentPlayer().then((p) => setPlayer(p ?? null), () => setPlayer(null))
    backend.getRestaurantSettings().then(setSettings, (e) => console.error(e))
  }, [])

  useEffect(() => {
    track(`view:${route || 'inicio'}`)
  }, [route])

  const navigate = useCallback((path) => {
    window.location.hash = `/${path}`
  }, [])

  const showToast = useCallback((message) => setToast({ message, id: Date.now() }), [])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2400)
    return () => clearTimeout(t)
  }, [toast])

  const registerPlayer = useCallback(async (data) => {
    const p = await backend.registerPlayer(data)
    setPlayer(p)
    track('player_registered')
    return p
  }, [])

  const switchPlayer = useCallback(async () => {
    await backend.signOutPlayer()
    setPlayer(null)
  }, [])

  const value = useMemo(
    () => ({ restaurant, settings, route, navigate, toast, showToast, player, registerPlayer, switchPlayer }),
    [settings, route, navigate, toast, showToast, player, registerPlayer, switchPlayer],
  )
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export const useApp = () => useContext(AppContext)

export const fullName = (p) => (p ? `${p.firstName} ${p.lastName}` : '')
