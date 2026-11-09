/** Marcador superior compartido por los juegos (estilo arcade). */
export default function GameHud({ items }) {
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
      {items.map(({ label, value, tone = 'neon', warn }) => (
        <div key={label} className="rounded-xl border-2 border-white/10 bg-black/30 px-1 py-2 text-center">
          <p className="font-pixel text-[7px] text-cream/50">{label}</p>
          <p
            className={`mt-1.5 truncate font-pixel text-[13px] tabular-nums ${
              warn ? 'animate-blink text-pink' : tone === 'mint' ? 'text-mint' : tone === 'pink' ? 'text-pink' : 'text-neon'
            }`}
          >
            {value}
          </p>
        </div>
      ))}
    </div>
  )
}
