import { useState } from 'react'

/**
 * Imagen con carga diferida, shimmer mientras carga y respaldo elegante
 * (emoji sobre degradado) si la foto no carga — útil con conexiones lentas.
 */
export default function SmartImage({ src, alt, emoji = '🍽️', className = '', eager = false }) {
  const [state, setState] = useState('loading')
  return (
    <div className={`relative overflow-hidden bg-sand ${className}`}>
      {state !== 'error' && (
        <img
          src={src}
          alt={alt}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={() => setState('ok')}
          onError={() => setState('error')}
          className={`h-full w-full object-cover transition-opacity duration-500 ${state === 'ok' ? 'opacity-100' : 'opacity-0'}`}
        />
      )}
      {state === 'loading' && <div className="shimmer absolute inset-0" />}
      {state === 'error' && (
        <div className="absolute inset-0 grid place-items-center bg-linear-to-br from-gold/40 via-sand to-terra/30">
          <span className="text-4xl drop-shadow-sm" aria-hidden>{emoji}</span>
        </div>
      )}
    </div>
  )
}
