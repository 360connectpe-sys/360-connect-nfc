import { useApp } from './context/AppContext'
import BottomNav from './components/BottomNav'
import NfcSplash from './components/NfcSplash'
import { Toast } from './components/ui'
import Home from './pages/Home'
import Menu from './pages/Menu'
import Promos from './pages/Promos'
import Connect from './pages/Connect'
import GamesHub from './pages/GamesHub'
import Ranking from './pages/Ranking'
import Prizes from './pages/Prizes'
import GameShell from './games/GameShell'
import { getGame } from './games/registry'

const routes = {
  '': Home,
  menu: Menu,
  promos: Promos,
  conecta: Connect,
  juegos: GamesHub,
  ranking: Ranking,
  premios: Prizes,
}

export default function App() {
  const { route } = useApp()

  const [section, sub] = route.split('/')
  const game = section === 'juegos' && sub ? getGame(sub) : null
  const inGame = game?.status === 'ready'
  const Page = routes[section] ?? Home

  return (
    // En escritorio se muestra como "teléfono" centrado (ideal para presentar la demo).
    <div className="min-h-dvh bg-[radial-gradient(circle_at_top,#4a3427,#24170f_60%)]">
      <div className={`relative mx-auto min-h-dvh max-w-md overflow-x-clip shadow-2xl ${section === 'juegos' ? 'bg-arcade' : 'bg-cream'}`}>
        <NfcSplash />
        <main key={route} className={`animate-fade-up ${inGame ? '' : 'pb-24'}`}>
          {inGame ? <GameShell game={game} /> : <Page />}
        </main>
        {!inGame && <BottomNav />}
        <Toast />
      </div>
    </div>
  )
}
