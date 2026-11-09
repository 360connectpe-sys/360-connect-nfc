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

  // Mesa por defecto. Cada placa NFC/QR apunta a la misma URL con ?mesa=XX
  // Ej.: https://usuario.github.io/360-connect/?mesa=07
  defaultTable: '04',

  // Enlaces de ejemplo: reemplazar por los reales del restaurante
  links: {
    instagram: 'https://instagram.com/casanativa.demo',
    tiktok: 'https://www.tiktok.com/@casanativa.demo',
    facebook: 'https://facebook.com/casanativa.demo',
    whatsapp:
      'https://wa.me/51987654321?text=' +
      encodeURIComponent('¡Hola Casa Nativa! Les escribo desde la mesa digital 👋'),
    maps: 'https://www.google.com/maps/search/?api=1&query=' +
      encodeURIComponent('Av. José Larco 742, Miraflores, Lima'),
  },

  // Credenciales ficticias
  wifi: {
    ssid: 'CasaNativa_Clientes',
    password: 'Ceviche2026!',
    security: 'WPA2',
  },

  // Premios para el TOP 3 del ranking semanal (configurables)
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
    'El ranking se reinicia cada lunes a las 00:00.',
    'Se considera la mejor puntuación de cada jugador en la semana.',
    'Para reclamar, muestra tu apodo y posición al personal.',
    'Premios no acumulables con otras promociones.',
  ],

  poweredBy: '360 CONNECT',
}

export { img }
