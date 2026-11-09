import { spriteURL } from './sprites'

/** Sprite pixel art como <img> (para la interfaz HTML). */
export default function Sprite({ name, size = 32, swap, className = '', alt = '' }) {
  return (
    <img
      src={spriteURL(name, swap)}
      alt={alt}
      draggable={false}
      className={`pixelated pointer-events-none select-none ${className}`}
      style={{ width: size, height: 'auto' }}
    />
  )
}
