/**
 * CONFIGURACIÓN DEL RESTAURANTE
 * ------------------------------------------------------------
 * Este es el ÚNICO archivo que hay que editar para personalizar
 * la web para otro restaurante (nombre, enlaces, Wi-Fi, premios…).
 * En el futuro, estos datos vendrán del panel administrativo
 * (base de datos) en lugar de estar escritos aquí.
 */

const img = (id, w = 800) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=60`

export const restaurant = {
  id: 'casa-nativa', // identificador único (se usa en ranking y salas)
  name: 'Casa Nativa',
  initials: 'CN',
  tagline: 'Cocina peruana & café de especialidad',
  welcome:
    'Qué gusto tenerte aquí. Mientras preparamos tu pedido, revisa la carta, descubre las promos del día y compite por premios en la Zona de Juegos.',
  address: 'Av. José Larco 742, Miraflores, Lima',
  hours: 'Lun – Dom · 8:00 a. m. – 11:00 p. m.',
  coverImage: img('photo-1517248135467-4c7edcad34c4', 1000),

  // Todas las placas NFC/QR del local apuntan a la MISMA URL (sin número de mesa).
  // Enlaces antiguos con ?mesa=XX siguen funcionando: el parámetro se ignora.

  // DEMO: los 7 juegos activos. Un restaurante real (isDemo: false) debe
  // activar EXACTAMENTE 4 (ver src/config/validateConfig.js).
  isDemo: true,
  enabledGames: ['memoria', 'chef-frenetico', 'carrera-chef', 'travieso', 'serpiente', 'duelo', 'carrera-multi'],
  // Ejemplo de restaurante real:
  // isDemo: false,
  // enabledGames: ['memoria', 'chef-frenetico', 'serpiente', 'duelo'],

  // Enlaces de ejemplo: reemplazar por los reales del restaurante
  links: {
    instagram: 'https://instagram.com/casanativa.demo',
    tiktok: 'https://www.tiktok.com/@casanativa.demo',
    facebook: 'https://facebook.com/casanativa.demo',
    whatsapp:
      'https://wa.me/51987654321?text=' +
      encodeURIComponent('¡Hola Casa Nativa! Les escribo desde la carta digital 👋'),
    maps: 'https://www.google.com/maps/search/?api=1&query=' +
      encodeURIComponent('Av. José Larco 742, Miraflores, Lima'),
  },

  // Credenciales ficticias
  wifi: {
    ssid: 'CasaNativa_Clientes',
    password: 'Ceviche2026!',
    security: 'WPA2',
  },

  // Premios por posición. Se entregan en CADA uno de los rankings semanales
  // (Memoria gastronómica, Chef Frenético y Carrera del Chef).
  prizes: [
    {
      place: 1,
      title: '20% de descuento',
      description: 'En el total de tu cuenta durante tu próxima visita.',
      emoji: '🏆',
    },
    {
      place: 2,
      title: 'Bebida gratis',
      description: 'Elige un pisco sour, chicha morada o café de especialidad.',
      emoji: '🍹',
    },
    {
      place: 3,
      title: '10% de descuento',
      description: 'Válido en platos de fondo de lunes a jueves.',
      emoji: '🎁',
    },
  ],
  prizeTerms: [
    'Cada temporada va de lunes 00:00 a domingo 23:59:59 (hora de Lima).',
    'Cuenta la mejor puntuación de cada jugador por juego (no se suman intentos).',
    'En caso de empate gana quien logró primero esa puntuación.',
    'Para reclamar: DNI físico + código de premio único. No pedimos ni guardamos tu DNI.',
    'El código es de un solo uso y vence a los 30 días del cierre de la temporada.',
    'Premios no acumulables con otras promociones.',
  ],
  prizeValidityDays: 30,

  poweredBy: '360 CONNECT',
}

export { img }
