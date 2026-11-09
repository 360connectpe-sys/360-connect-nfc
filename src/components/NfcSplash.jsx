import { useEffect, useState } from 'react'
import { Check, Nfc } from 'lucide-react'
import { useApp } from '../context/AppContext'

/**
 * Pantalla breve que simula el momento en que el cliente acerca el
 * celular a la placa NFC (o escanea el QR). Se muestra 1 vez por sesión.
 */
export default function NfcSplash() {
  const { restaurant, table } = useApp()
  const [phase, setPhase] = useState(() => (sessionStorage.getItem('360c:splash') ? 'done' : 'connecting'))

  useEffect(() => {
    if (sessionStorage.getItem('360c:splash')) return
    const t1 = setTimeout(() => setPhase('ready'), 1100)
    const t2 = setTimeout(() => {
      setPhase('done')
      sessionStorage.setItem('360c:splash', '1')
    }, 2100)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [])

  if (phase === 'done') return null

  return (
    <div
      onClick={() => {
        setPhase('done')
        sessionStorage.setItem('360c:splash', '1')
      }}
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-espresso text-cream"
    >
      <div className="relative grid size-28 place-items-center">
        <span className="absolute inset-0 animate-ping-slow rounded-full bg-terra/30" />
        <span className="absolute inset-3 animate-ping-slow rounded-full bg-terra/30 [animation-delay:400ms]" />
        <span className="relative grid size-20 place-items-center rounded-full bg-terra shadow-2xl">
          {phase === 'ready' ? <Check className="size-9 animate-pop" strokeWidth={3} /> : <Nfc className="size-9" />}
        </span>
      </div>
      <p className="mt-8 text-sm text-cream/60">{phase === 'ready' ? '¡Conectado!' : 'Conectando con tu mesa…'}</p>
      <h1 className="mt-2 font-display text-3xl font-bold">{restaurant.name}</h1>
      <p className="mt-1 text-lg font-semibold text-gold">Mesa {table}</p>
      <p className="absolute bottom-8 text-[11px] tracking-widest text-cream/35 uppercase">
        Powered by {restaurant.poweredBy}
      </p>
    </div>
  )
}
