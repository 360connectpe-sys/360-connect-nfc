import { img } from '../config/restaurant'

// Menú de demostración. Precios en soles (S/).
// Las fotos son referenciales (Unsplash); reemplazar por fotos reales del local.
export const menuCategories = [
  { id: 'entradas', label: 'Entradas', emoji: '🥗' },
  { id: 'principales', label: 'Principales', emoji: '🍛' },
  { id: 'bebidas', label: 'Bebidas', emoji: '🍹' },
  { id: 'postres', label: 'Postres', emoji: '🍮' },
]

export const menuItems = [
  // ENTRADAS
  {
    id: 'ceviche', category: 'entradas', name: 'Ceviche clásico',
    description: 'Pesca del día en leche de tigre, ají limo, camote glaseado y choclo.',
    price: 38, image: img('photo-1535399831218-d5bd36d1a6b3', 500), emoji: '🐟', tags: ['Popular'],
  },
  {
    id: 'causa', category: 'entradas', name: 'Causa limeña',
    description: 'Papa amarilla prensada con ají amarillo, pollo deshilachado y palta.',
    price: 24, image: img('photo-1546069901-ba9599a7e63c', 500), emoji: '🥔', tags: [],
  },
  {
    id: 'huancaina', category: 'entradas', name: 'Papa a la huancaína',
    description: 'Papas sancochadas bañadas en crema de ají amarillo y queso fresco.',
    price: 18, image: img('photo-1540189549336-e6e99c3679fe', 500), emoji: '🥔', tags: ['Vegetariano'],
  },
  {
    id: 'anticuchos', category: 'entradas', name: 'Anticuchos de corazón',
    description: 'Brochetas a la parrilla con papas doradas y crema de rocoto.',
    price: 28, image: img('photo-1555939594-58d7cb561ad1', 500), emoji: '🍢', tags: ['Picante'],
  },

  // PRINCIPALES
  {
    id: 'lomo', category: 'principales', name: 'Lomo saltado',
    description: 'Lomo fino salteado al wok con cebolla, tomate, papas fritas y arroz.',
    price: 46, image: img('photo-1600891964092-4316c288032e', 500), emoji: '🥩', tags: ['Popular'],
  },
  {
    id: 'aji-gallina', category: 'principales', name: 'Ají de gallina',
    description: 'Crema de ají amarillo con gallina deshilachada, aceituna y huevo.',
    price: 36, image: img('photo-1455619452474-d2be8b1e70cd', 500), emoji: '🍛', tags: [],
  },
  {
    id: 'arroz-mariscos', category: 'principales', name: 'Arroz con mariscos',
    description: 'Arroz meloso con langostinos, calamar y conchas, salsa criolla.',
    price: 48, image: img('photo-1515443961218-a51367888e4b', 500), emoji: '🦐', tags: ['Del chef'],
  },
  {
    id: 'pollo-brasa', category: 'principales', name: '1/4 Pollo a la brasa',
    description: 'Marinado 24 h, papas nativas fritas, ensalada y cremas de la casa.',
    price: 29, image: img('photo-1598103442097-8b74394b95c6', 500), emoji: '🍗', tags: [],
  },

  // BEBIDAS
  {
    id: 'chicha', category: 'bebidas', name: 'Chicha morada',
    description: 'Maíz morado, piña, canela y clavo. Vaso / jarra 1 L (S/ 22).',
    price: 9, image: img('photo-1544145945-f90425340c7e', 500), emoji: '🟣', tags: ['Sin alcohol'],
  },
  {
    id: 'pisco-sour', category: 'bebidas', name: 'Pisco sour',
    description: 'Pisco quebranta, limón, jarabe de goma, clara de huevo y amargo de angostura.',
    price: 26, image: img('photo-1514362545857-3bc16c4c7d1b', 500), emoji: '🍸', tags: ['Popular'],
  },
  {
    id: 'limonada', category: 'bebidas', name: 'Limonada frozen',
    description: 'Limón sutil, hierba buena y hielo frappé.',
    price: 12, image: img('photo-1556679343-c7306c1976bc', 500), emoji: '🍋', tags: ['Sin alcohol'],
  },
  {
    id: 'cafe', category: 'bebidas', name: 'Café de Chanchamayo',
    description: 'Filtrado en V60 con granos de altura de la selva central.',
    price: 14, image: img('photo-1495474472287-4d71bcdd2085', 500), emoji: '☕', tags: [],
  },

  // POSTRES
  {
    id: 'suspiro', category: 'postres', name: 'Suspiro a la limeña',
    description: 'Manjar blanco con merengue al oporto y canela.',
    price: 16, image: img('photo-1488477181946-6428a0291777', 500), emoji: '🍮', tags: ['Clásico'],
  },
  {
    id: 'picarones', category: 'postres', name: 'Picarones',
    description: 'Buñuelos de zapallo y camote con miel de chancaca.',
    price: 18, image: img('photo-1551024601-bec78aea704b', 500), emoji: '🍩', tags: ['Popular'],
  },
  {
    id: 'tres-leches', category: 'postres', name: 'Tres leches de lúcuma',
    description: 'Bizcocho húmedo con crema de lúcuma.',
    price: 17, image: img('photo-1578985545062-69928b1d9587', 500), emoji: '🍰', tags: [],
  },
  {
    id: 'brownie', category: 'postres', name: 'Brownie con helado',
    description: 'Brownie de cacao peruano 70% con helado de vainilla.',
    price: 19, image: img('photo-1563805042-7684c019e1cb', 500), emoji: '🍫', tags: [],
  },
]
