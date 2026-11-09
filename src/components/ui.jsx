import { ChevronLeft } from 'lucide-react'
import { useApp } from '../context/AppContext'

export const formatPrice = (n) =>
  `S/ ${Number(n).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

/** Encabezado de sección para páginas internas (estilo restaurante). */
export function PageHeader({ title, subtitle, back = '', right = null, dark = false }) {
  const { navigate } = useApp()
  return (
    <header
      className={`sticky top-0 z-30 flex items-center gap-3 px-4 pt-4 pb-3 backdrop-blur-md ${
        dark ? 'bg-arcade/85 text-cream' : 'bg-cream/85 text-espresso'
      }`}
    >
      {back !== null && (
        <button
          onClick={() => navigate(back)}
          aria-label="Volver"
          className={`grid size-10 shrink-0 place-items-center rounded-full ${dark ? 'bg-white/10' : 'bg-sand'} active:scale-95 transition`}
        >
          <ChevronLeft className="size-5" />
        </button>
      )}
      <div className="min-w-0 flex-1">
        <h1 className={`truncate leading-tight ${dark ? 'font-pixel text-[13px] text-neon' : 'font-display text-2xl font-bold'}`}>
          {title}
        </h1>
        {subtitle && <p className={`truncate text-xs ${dark ? 'mt-1 text-cream/60' : 'text-cocoa/70'}`}>{subtitle}</p>}
      </div>
      {right}
    </header>
  )
}

export function SimBadge({ children = 'Demo', dark = false }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
        dark ? 'bg-white/10 text-cream/70' : 'bg-latte/60 text-cocoa'
      }`}
    >
      {children}
    </span>
  )
}

export function Toast() {
  const { toast } = useApp()
  if (!toast) return null
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center px-4">
      <div key={toast.id} className="animate-pop rounded-full bg-espresso px-5 py-3 text-sm font-semibold text-cream shadow-xl">
        {toast.message}
      </div>
    </div>
  )
}
