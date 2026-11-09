import { img } from '../config/restaurant'

// Promociones de demostración (en el futuro: editables desde el panel admin)
export const promos = [
  {
    id: 'martes-ceviche', type: 'Descuento especial', badge: '-20%',
    title: 'Martes de Ceviche',
    description: 'Todos los martes, 20% de descuento en cualquier ceviche de la carta.',
    oldPrice: 38, price: 30.4, validity: 'Solo martes',
    image: img('photo-1535399831218-d5bd36d1a6b3', 700), emoji: '🐟', accent: 'terra',
  },
  {
    id: 'menu-dia', type: 'Promo del día', badge: 'HOY',
    title: 'Menú ejecutivo',
    description: 'Entrada + plato de fondo + chicha morada. Pregunta por las opciones de hoy.',
    price: 25, validity: 'Lun – Vie · 12:00 – 4:00 p. m.',
    image: img('photo-1504674900247-0877df9cc836', 700), emoji: '🍽️', accent: 'gold',
  },
  {
    id: 'combo-brasa', type: 'Combo', badge: 'COMBO',
    title: 'Combo Brasa Familiar',
    description: '1 pollo a la brasa, papas familiares, ensalada y chicha morada 1 L.',
    oldPrice: 95, price: 79, validity: 'Todos los días',
    image: img('photo-1598103442097-8b74394b95c6', 700), emoji: '🍗', accent: 'olive',
  },
  {
    id: 'happy-hour', type: 'Promo del día', badge: '2x1',
    title: 'Happy hour de Pisco Sour',
    description: 'Pide un pisco sour y el segundo va por cuenta de la casa.',
    price: 26, validity: 'Todos los días · 5:00 – 8:00 p. m.',
    image: img('photo-1514362545857-3bc16c4c7d1b', 700), emoji: '🍸', accent: 'terra',
  },
  {
    id: 'cafe-postre', type: 'Combo', badge: 'COMBO',
    title: 'Café + postre',
    description: 'Café de Chanchamayo + suspiro a la limeña o picarones.',
    oldPrice: 30, price: 22, validity: 'Todos los días · desde las 3:00 p. m.',
    image: img('photo-1509042239860-f550ce710b93', 700), emoji: '☕', accent: 'gold',
  },
]

// Programa de fidelización (simulado)
export const loyalty = {
  name: 'Club Casa Nativa',
  stampsRequired: 10,
  demoStamps: 6,
  reward: 'un plato de fondo gratis',
}
