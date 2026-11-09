import { lazy } from 'react'

/**
 * CATÁLOGO 360 CONNECT — exactamente 7 juegos
 * ------------------------------------------------------------
 * category:
 *   'ranked' → individual, participa en el ranking semanal con premios
 *   'casual' → individual, solo récord personal (sin premios)
 *   'multi'  → multijugador con salas privadas por código (sin mesas)
 *
 * La demo (Casa Nativa) activa los 7. Un restaurante real activa
 * exactamente 4 (ver src/config/restaurant.js → enabledGames).
 * Los juegos se cargan bajo demanda (lazy) para que la web sea liviana.
 */
export const GAME_CATALOG = [
  {
    id: 'memoria',
    name: 'Memoria gastronómica',
    category: 'ranked',
    sprite: 'avocado',
    color: '#ff6b8b',
    tagline: 'Encuentra las parejas de la cocina peruana',
    duration: 'Hasta 3 min',
    howTo: [
      'Toca dos cartas para voltearlas.',
      'Si son iguales, quedan descubiertas; si no, se ocultan.',
      'Menos errores y menos tiempo = más puntos (base 5 000).',
    ],
    Component: lazy(() => import('./solo/MemoryGame')),
  },
  {
    id: 'chef-frenetico',
    name: 'Chef Frenético',
    category: 'ranked',
    sprite: 'basket',
    color: '#ffb547',
    tagline: 'Atrapa los ingredientes del pedido',
    duration: '45 s',
    howTo: [
      'Mueve la cesta deslizando el dedo (o con ← →).',
      'Atrapa SOLO los ingredientes del pedido: +100 pts.',
      'Lo que no está en el pedido o está malogrado: −50 pts.',
      'Completa pedidos para subir el multiplicador hasta x3.',
    ],
    Component: lazy(() => import('./solo/ChefFrenetico')),
  },
  {
    id: 'carrera-chef',
    name: 'Carrera del Chef',
    category: 'ranked',
    sprite: 'chef',
    color: '#5eead4',
    tagline: 'Corre, salta y recoge monedas',
    duration: 'Hasta 60 s',
    howTo: [
      'El chef corre solo. Toca la pantalla (o ESPACIO) para saltar.',
      'Esquiva ollas, ralladores y cuchillos voladores.',
      'Monedas +50 · ingredientes +100 · distancia suma puntos.',
      'Tienes 3 vidas. ⏸ para pausar.',
    ],
    Component: lazy(() => import('./solo/CarreraChef')),
  },
  {
    id: 'travieso',
    name: 'Atrapa al Travieso',
    category: 'casual',
    sprite: 'cuy',
    color: '#c084fc',
    tagline: 'El cuy se escapó de la cocina',
    duration: '30 s',
    howTo: [
      'Toca al cuy travieso antes de que se esconda: +50.',
      'El cuy dorado vale +150.',
      '¡No toques al chef ni las bombas! −75.',
    ],
    Component: lazy(() => import('./solo/AtrapaTravieso')),
  },
  {
    id: 'serpiente',
    name: 'Serpiente Hambrienta',
    category: 'casual',
    sprite: 'tomato',
    color: '#5fb84a',
    tagline: 'El clásico, versión peruana',
    duration: 'Sin límite',
    howTo: [
      'Desliza el dedo o usa las flechas para girar.',
      'Come ingredientes para crecer y sumar puntos.',
      'No choques con las paredes ni contigo misma.',
    ],
    Component: lazy(() => import('./solo/SerpienteHambrienta')),
  },
  {
    id: 'duelo',
    name: 'Duelo Arcade',
    internalName: 'Duelo de Mesa',
    category: 'multi',
    sprite: 'star',
    color: '#ff8a3d',
    tagline: 'Reta a un amigo: el más rápido gana',
    players: '2 jugadores',
    minPlayers: 2,
    maxPlayers: 2,
    Component: lazy(() => import('./multi/DueloArcade')),
  },
  {
    id: 'carrera-multi',
    name: 'Carrera Multijugador',
    internalName: 'Carrera de Mesa',
    category: 'multi',
    sprite: 'car',
    color: '#60a5fa',
    tagline: 'Carrera de autos, cada uno en su celular',
    players: '2–4 jugadores',
    minPlayers: 2,
    maxPlayers: 4,
    Component: lazy(() => import('./multi/CarreraMultijugador')),
  },
]

export const CATEGORIES = [
  { id: 'ranked', emoji: '🏆', title: 'Compite por premios', subtitle: 'Ranking semanal con premios para el top 3' },
  { id: 'casual', emoji: '🎮', title: 'Juega por diversión', subtitle: 'Supera tu récord personal' },
  { id: 'multi', emoji: '⚔️', title: 'Desafía a tus amigos', subtitle: 'Salas privadas con código' },
]

export const ALL_GAME_IDS = GAME_CATALOG.map((g) => g.id)
export const RANKED_GAME_IDS = GAME_CATALOG.filter((g) => g.category === 'ranked').map((g) => g.id)
export const getGame = (id) => GAME_CATALOG.find((g) => g.id === id)
export const gameName = (id) => getGame(id)?.name ?? id
export const filterEnabled = (enabledIds) => GAME_CATALOG.filter((g) => enabledIds.includes(g.id))
