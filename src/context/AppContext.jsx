import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { restaurant } from '../config/restaurant'
import { track } from '../services/analytics'

const AppContext = createContext(null)

/** Mesa: se lee de la URL (?mesa=07) que trae cada placa NFC/QR. */
function resolveTable() {
  const fromUrl = new URLSearchParams(window.location.search).get('mesa')
  if (fromUrl && /^\d{1,3}$/.test(fromUrl)) {
    const t = fromUrl.padStart(2, '0')
    sessionStorage.setItem('360c:table', t)
    return t
  }
  return sessionStorage.getItem('360c:table') || restaurant.defaultTable
}

/** Ruta basada en hash (#/menu) => compatible con GitHub Pages sin configuración. */
const readRoute = () => window.location.hash.replace(/^#\/?/, '').split('?')[0]

export function AppProvider({ children }) {
  const [table] = useState(resolveTable)
  const [route, setRoute] = useState(readRoute)
  const [nickname, setNicknameState] = useState(() => localStorage.getItem('360c:nickname') || '')
  const [toast, setToast] = useState(null)

  useEffect(() => {
    const onHash = () => {
      setRoute(readRoute())
      window.scrollTo({ top: 0 })
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => {
    track(`view:${route || 'inicio'}`, { table })
  }, [route, table])

  const navigate = useCallback((path) => {
    window.location.hash = `/${path}`
  }, [])

  const setNickname = useCallback((name) => {
    const clean = name.trim().slice(0, 16)
    localStorage.setItem('360c:nickname', clean)
    setNicknameState(clean)
  }, [])

  const showToast = useCallback((message) => {
    setToast({ message, id: Date.now() })
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2200)
    return () => clearTimeout(t)
  }, [toast])

  const value = useMemo(
    () => ({ restaurant, table, route, navigate, nickname, setNickname, toast, showToast }),
    [table, route, navigate, nickname, setNickname, toast, showToast],
  )
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export const useApp = () => useContext(AppContext)
