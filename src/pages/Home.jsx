import { ChevronRight, Clock, Gift, MapPin, Tag, Trophy, UtensilsCrossed, Wifi, Share2 } from 'lucide-react'
import { useApp } from '../context/AppContext'
import SmartImage from '../components/SmartImage'
import { formatPrice } from '../components/ui'
import { promos } from '../data/promos'

const quick = [
  { path: 'menu', label: 'Menú', sub: 'Carta digital', Icon: UtensilsCrossed, tone: 'bg-terra/10 text-terra' },
  { path: 'promos', label: 'Promos', sub: 'Del día', Icon: Tag, tone: 'bg-gold/15 text-[#b07614]' },
  { path: 'conecta', label: 'Wi-Fi', sub: 'Conéctate', Icon: Wifi, tone: 'bg-olive/12 text-olive' },
  { path: 'conecta', label: 'Redes', sub: 'Síguenos', Icon: Share2, tone: 'bg-cocoa/10 text-cocoa' },
  { path: 'ranking', label: 'Ranking', sub: 'Semanal', Icon: Trophy, tone: 'bg-gold/15 text-[#b07614]' },
  { path: 'premios', label: 'Premios', sub: 'Top 3', Icon: Gift, tone: 'bg-terra/10 text-terra' },
]

export default function Home() {
  const { restaurant, navigate, player } = useApp()
  const todayPromo = promos[1]

  return (
    <div className="pb-6">
      {/* Portada */}
      <section className="relative h-[46vh] min-h-[320px] max-h-[440px]">
        <SmartImage src={restaurant.coverImage} alt={`Interior de ${restaurant.name}`} emoji="🍽️" eager className="absolute inset-0 h-full" />
        <div className="absolute inset-0 bg-linear-to-t from-espresso via-espresso/45 to-espresso/10" />
        <div className="absolute top-4 right-4 left-4 flex items-center justify-between">
          <div className="grid size-12 place-items-center rounded-2xl bg-terra font-display text-lg font-bold text-cream shadow-lg ring-2 ring-cream/30">
            {restaurant.initials}
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-cream/95 px-3 py-1.5 text-xs font-bold text-espresso shadow-sm">
            <span className="size-2 rounded-full bg-olive" /> Abierto hoy
          </span>
        </div>
        <div className="absolute right-5 bottom-10 left-5 animate-fade-up text-cream">
          <p className="text-sm font-semibold tracking-wide text-gold">¡Bienvenido{player ? `, ${player.firstName}` : ''}!</p>
          <h1 className="mt-1 font-display text-[2.6rem] leading-none font-bold">{restaurant.name}</h1>
          <p className="mt-2 text-sm text-cream/80">{restaurant.tagline}</p>
        </div>
      </section>

      <div className="relative -mt-6 rounded-t-[28px] bg-cream px-4 pt-6">
        <p className="animate-fade-up text-[15px] leading-relaxed text-cocoa">{restaurant.welcome}</p>

        {/* Zona de juegos destacada */}
        <button
          onClick={() => navigate('juegos')}
          className="arcade-bg mt-5 flex w-full animate-fade-up items-center gap-4 overflow-hidden rounded-3xl p-5 text-left shadow-xl ring-1 ring-black/5 transition active:scale-[0.98]"
        >
          <div className="pixel-frame grid size-16 shrink-0 place-items-center rounded-2xl bg-arcade-2 text-3xl">🕹️</div>
          <div className="min-w-0 flex-1">
            <p className="font-pixel text-[11px] leading-relaxed text-neon">ZONA DE JUEGOS</p>
            <p className="mt-1.5 text-sm text-cream/80">7 juegos arcade · compite por premios cada semana.</p>
          </div>
          <span className="animate-blink font-pixel text-xs text-mint">▶</span>
        </button>

        {/* Accesos rápidos */}
        <div className="mt-5 grid grid-cols-3 gap-3">
          {quick.map(({ path, label, sub, Icon, tone }, i) => (
            <button
              key={label}
              onClick={() => navigate(path)}
              style={{ animationDelay: `${i * 40}ms` }}
              className="flex animate-fade-up flex-col items-center gap-2 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-latte/50 transition active:scale-95"
            >
              <span className={`grid size-11 place-items-center rounded-xl ${tone}`}>
                <Icon className="size-5" />
              </span>
              <span className="text-sm leading-none font-bold">{label}</span>
              <span className="text-[11px] leading-none text-cocoa/60">{sub}</span>
            </button>
          ))}
        </div>

        {/* Promo del día */}
        <div className="mt-7 flex items-end justify-between">
          <h2 className="font-display text-xl font-bold">Promo de hoy</h2>
          <button onClick={() => navigate('promos')} className="flex items-center text-sm font-semibold text-terra">
            Ver todas <ChevronRight className="size-4" />
          </button>
        </div>
        <button onClick={() => navigate('promos')} className="mt-3 flex w-full items-stretch overflow-hidden rounded-3xl bg-white text-left shadow-sm ring-1 ring-latte/50 active:scale-[0.99] transition">
          <SmartImage src={todayPromo.image} alt={todayPromo.title} emoji={todayPromo.emoji} className="w-32 shrink-0" />
          <div className="flex-1 p-4">
            <span className="rounded-full bg-gold px-2 py-0.5 text-[10px] font-extrabold text-espresso">{todayPromo.badge}</span>
            <p className="mt-2 font-bold">{todayPromo.title}</p>
            <p className="mt-1 line-clamp-2 text-xs text-cocoa/70">{todayPromo.description}</p>
            <p className="mt-2 font-display text-lg font-bold text-terra">{formatPrice(todayPromo.price)}</p>
          </div>
        </button>

        {/* Info */}
        <div className="mt-7 space-y-3 rounded-3xl bg-sand/70 p-5 text-sm">
          <p className="flex items-center gap-3"><Clock className="size-4 text-terra" /> {restaurant.hours}</p>
          <a href={restaurant.links.maps} target="_blank" rel="noreferrer" className="flex items-center gap-3">
            <MapPin className="size-4 text-terra" /> <span className="underline decoration-latte underline-offset-4">{restaurant.address}</span>
          </a>
        </div>

        <p className="mt-8 text-center text-[11px] tracking-widest text-cocoa/40 uppercase">
          Carta digital · Powered by <strong>{restaurant.poweredBy}</strong>
        </p>
      </div>
    </div>
  )
}
