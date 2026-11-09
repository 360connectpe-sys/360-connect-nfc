import { Suspense } from 'react'
import { useApp } from './context/AppContext'
import BottomNav from './components/BottomNav'
import NfcSplash from './components/NfcSplash'
import { PageHeader, Toast } from './components/ui'
import Home from './pages/Home'
import Menu from './pages/Menu'
import Promos from './pages/Promos'
import Connect from './pages/Connect'
import GamesHub from './pages/GamesHub'
import Ranking from './pages/Ranking'
import Prizes from './pages/Prizes'
import Staff from './pages/Staff'
import SoloGameShell from './games/SoloGameShell'
import { getGame } from './games/catalog'

const routes = {
  '': Home,
  menu: Menu,
  promos: Promos,
  conecta: Connect,
  juegos: GamesHub,
  ranking: Ranking,
  premios: Prizes,
  personal: Staff,
}

function GameRoute({ id }) {
  const { settings, navigate } = useApp()
  const game = getGame(id)
  // Juegos no activos para este restaurante: no se pueden abrir ni con enlace directo.
  if (!game || !settings.enabledGames.includes(id)) {
    return (
      <div className="arcade-bg min-h-dvh text-cream">
        <PageHeader dark title="NO DISPONIBLE" back="juegos" />
        <div className="px-6 py-16 text-center">
          <p className="text-cream/70">Este juego no está disponible en este restaurante.</p>
          <button onClick={() => navigate('juegos')} className="pixel-btn mt-6 px-6 py-4">Ver juegos</button>
        </div>
      </div>
    )
  }
  if (game.category === 'multi') {
    const Page = game.Component
    return (
      <Suspense fallback={<div className="arcade-bg grid min-h-dvh place-items-center font-pixel text-xs text-neon">CARGANDO…</div>}>
        <Page game={game} />
      </Suspense>
    )
  }
  return <SoloGameShell game={game} />
}

export default function App() {
  const { route } = useApp()
  const [section, sub] = route.split('/')
  const inGame = section === 'juegos' && !!sub
  const Page = routes[section] ?? Home
  const dark = section === 'juegos'

  return (
    // En escritorio se muestra como "teléfono" centrado (ideal para presentar la demo).
    <div className="min-h-dvh bg-[radial-gradient(circle_at_top,#4a3427,#24170f_60%)]">
      <div className={`relative mx-auto min-h-dvh max-w-md overflow-x-clip shadow-2xl ${dark ? 'bg-arcade' : 'bg-cream'}`}>
        <NfcSplash />
        <main key={inGame ? `game-${sub}` : section} className={`animate-fade-up ${inGame ? '' : 'pb-24'}`}>
          {inGame ? <GameRoute id={sub} /> : <Page />}
        </main>
        {!inGame && <BottomNav />}
        <Toast />
      </div>
    </div>
  )
}
