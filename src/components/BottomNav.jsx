import { Gamepad2, Home, Tag, Trophy, UtensilsCrossed } from 'lucide-react'
import { useApp } from '../context/AppContext'

const items = [
  { path: '', label: 'Inicio', Icon: Home },
  { path: 'menu', label: 'Menú', Icon: UtensilsCrossed },
  { path: 'juegos', label: 'Juegos', Icon: Gamepad2, featured: true },
  { path: 'ranking', label: 'Ranking', Icon: Trophy },
  { path: 'promos', label: 'Promos', Icon: Tag },
]

export default function BottomNav() {
  const { route, navigate } = useApp()
  const section = route.split('/')[0]

  return (
    <nav className="pb-safe fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md border-t border-latte/60 bg-cream/95 backdrop-blur-md">
      <ul className="grid grid-cols-5 items-end px-2 pt-1.5 pb-2">
        {items.map(({ path, label, Icon, featured }) => {
          const active = section === path || (path === '' && section === '')
          if (featured) {
            return (
              <li key={path} className="flex justify-center">
                <button
                  onClick={() => navigate(path)}
                  className="-mt-7 flex flex-col items-center gap-1"
                  aria-label={label}
                >
                  <span
                    className={`grid size-14 place-items-center rounded-2xl border-4 border-cream shadow-lg transition active:scale-95 ${
                      active ? 'bg-arcade text-neon' : 'bg-terra text-cream'
                    }`}
                  >
                    <Icon className="size-6" />
                  </span>
                  <span className={`text-[11px] font-bold ${active ? 'text-terra' : 'text-cocoa/70'}`}>{label}</span>
                </button>
              </li>
            )
          }
          return (
            <li key={path}>
              <button
                onClick={() => navigate(path)}
                className="flex w-full flex-col items-center gap-1 rounded-xl py-1.5 transition active:scale-95"
                aria-current={active ? 'page' : undefined}
              >
                <Icon className={`size-[22px] transition ${active ? 'text-terra' : 'text-cocoa/55'}`} strokeWidth={active ? 2.4 : 2} />
                <span className={`text-[11px] font-semibold ${active ? 'text-terra' : 'text-cocoa/60'}`}>{label}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
