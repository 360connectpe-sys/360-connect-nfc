import { useState } from 'react'
import { menuCategories, menuItems } from '../data/menu'
import SmartImage from '../components/SmartImage'
import { PageHeader, formatPrice } from '../components/ui'

const tagTone = {
  Popular: 'bg-terra text-cream',
  Picante: 'bg-[#d33] text-cream',
  Vegetariano: 'bg-olive text-cream',
  'Sin alcohol': 'bg-olive/80 text-cream',
  'Del chef': 'bg-espresso text-gold',
  Clásico: 'bg-gold text-espresso',
}

export default function Menu() {
  const [active, setActive] = useState(menuCategories[0].id)
  const items = menuItems.filter((i) => i.category === active)

  return (
    <div className="min-h-dvh bg-cream pb-6">
      <PageHeader title="Nuestra carta" subtitle="Precios en soles (S/) · Incluyen IGV" />

      {/* Categorías */}
      <div className="sticky top-[74px] z-20 bg-cream/90 backdrop-blur-md">
        <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-3">
          {menuCategories.map((c) => (
            <button
              key={c.id}
              onClick={() => setActive(c.id)}
              className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold transition active:scale-95 ${
                active === c.id ? 'bg-espresso text-cream shadow-md' : 'bg-white text-cocoa ring-1 ring-latte/70'
              }`}
            >
              <span>{c.emoji}</span> {c.label}
            </button>
          ))}
        </div>
      </div>

      <ul key={active} className="space-y-3 px-4 pt-1">
        {items.map((item, i) => (
          <li
            key={item.id}
            style={{ animationDelay: `${i * 50}ms` }}
            className="flex animate-fade-up gap-4 rounded-3xl bg-white p-3 shadow-sm ring-1 ring-latte/50"
          >
            <SmartImage src={item.image} alt={item.name} emoji={item.emoji} className="size-28 shrink-0 rounded-2xl" />
            <div className="flex min-w-0 flex-1 flex-col py-1 pr-1">
              <div className="flex flex-wrap gap-1">
                {item.tags.map((t) => (
                  <span key={t} className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${tagTone[t] || 'bg-sand text-cocoa'}`}>{t}</span>
                ))}
              </div>
              <h3 className="mt-1 font-display text-[17px] leading-tight font-bold">{item.name}</h3>
              <p className="mt-1 line-clamp-2 text-xs leading-snug text-cocoa/70">{item.description}</p>
              <p className="mt-auto pt-2 text-base font-extrabold text-terra">{formatPrice(item.price)}</p>
            </div>
          </li>
        ))}
      </ul>

      <p className="mx-4 mt-6 rounded-2xl bg-sand/70 p-4 text-center text-xs text-cocoa/70">
        Para ordenar, llama a tu mozo. Pedidos y pagos desde la mesa: <strong>próximamente</strong>.
      </p>
    </div>
  )
}
