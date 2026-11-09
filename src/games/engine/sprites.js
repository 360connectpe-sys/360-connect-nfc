/**
 * MOTOR DE SPRITES PIXEL ART (sin archivos de imagen = carga instantánea)
 * ------------------------------------------------------------------
 * Cada sprite es una lista de filas; cada carácter es un píxel con un
 * color de la paleta ('.' = transparente). Al generarse se le agrega
 * automáticamente un contorno oscuro de 1 px (estilo 16-bit).
 * `swap` permite recolorear un sprite (ej. auto de cada jugador).
 */
export const PALETTE = {
  k: '#1b1220', w: '#fbf5ec', r: '#e04f3a', R: '#a5321f', g: '#5fb84a', G: '#2f7a32',
  y: '#ffd34a', Y: '#e6a12e', o: '#ff8a3d', b: '#a0673f', B: '#5a3a26', s: '#f2c79b',
  p: '#9b59d0', P: '#6b3a99', c: '#5ec8f0', C: '#2f7fb8', n: '#c3cad2', N: '#5d646d',
  m: '#ff6b8b', l: '#c7e86b',
}
const OUTLINE = '#1b1220'

const CHEF_HEAD = [
  '...wwwww....',
  '..wwwwwww...',
  '..wwwwwww...',
  '...wnnnw....',
  '...sssss....',
  '...sksks....',
  '...sssss....',
  '....srs.....',
]

export const SPRITES = {
  tomato: [
    '....GG.G....', '...GgGGg....', '..rrGrrrr...', '.rrrrrrrrr..', 'rrwrrrrrrrr.', 'rwrrrrrrrrr.',
    'rrrrrrrrrrR.', 'rrrrrrrrrrR.', '.rrrrrrrrR..', '.RrrrrrrRR..', '..RRRRRRR...',
  ],
  fish: [
    '....ccc.....', '..ccccccc..c', '.ccwkcccccCc', 'cccccccccCC.', 'cCcccccccCCc', '.CCCCCCCC..C', '..CCCCCC....',
  ],
  corn: [
    '....G...', '...GyG..', '..GyyyG.', '..GyYyG.', '..GyyyG.', '.GGyYyGG', '.GGyyyGG', '.GGyYyGG', '..GGyGG.', '...GGG..',
  ],
  chili: [
    '........G', '.......GG', '......rrG', '.....rrr.', '....rrrR.', '...rrrR..', '..rrrR...', '.rrrR....', 'rrR......',
  ],
  lemon: [
    '....yyyy..G.', '..yyyyyyyGG.', '.ywyyyyyyy..', '.yyyyyyyyyy.', '.yyyyyyyyyY.', '..yyyyyyyY..', '...YYYYYY...',
  ],
  avocado: [
    '...GGG....', '..GgggG...', '.GgyyygG..', '.GgyyyygG.', 'GgyybbyygG', 'GgybBBbygG', 'GgybBBbygG', 'GgyybbyygG',
    '.GgyyyygG.', '..GGGGGG..',
  ],
  potato: [
    '...bbbbb....', '.bbbbbbbbb..', 'bbBbbbbbbbb.', 'bbbbbbbBbbb.', 'bbbbbbbbbbB.', '.bbBbbbbbB..', '..BBBBBBB...',
  ],
  cup: [
    '..n..n.....', '...n..n....', '...........', 'wwwwwwww...', 'wBBBBBBwww.', 'wwwwwwwww.w', 'wwwwwwwww.w',
    'wwwwwwwwww.', '.wwwwwwww..', '..nnnnnn...',
  ],
  flan: [
    '....bbbb....', '...bBBBBb...', '..yyyyyyyy..', '..yyyyyyyy..', '.yyyyyyyyyy.', '.yyyyyyyyyY.', 'nnnnnnnnnnnn',
  ],
  pisco: [
    '.wwwwwww.', '.ywwwwwy.', '.yyyyyyy.', '..yyyyy..', '...yyy...', '....n....', '....n....', '..nnnnn..',
  ],
  // --- objetos malos ---
  bomb: [
    '........y.o', '.......n.y.', '......n....', '...NNNN....', '..NNNNNN...', '.NNwNNNNN..', '.NwNNNNNN..',
    '.NNNNNNNN..', '.NNNNNNNN..', '..NNNNNN...', '...NNNN....',
  ],
  shoe: [
    '...bbb.....', '...bBb.....', '...bbb.....', '...bbbbbbb.', '..bbbbbbbbb', '..BBBBBBBBB', '..nnnnnnnnn',
  ],
  // --- personajes ---
  chef: [
    ...CHEF_HEAD,
    '..wwwwwww...', '.swwwrwwws..', '.swwwwwwws..', '...wwwww....', '...NNNNN....', '...NN.NN....', '..NN...NN...', '..kk...kk...',
  ],
  chef2: [
    ...CHEF_HEAD,
    '..wwwwwww...', '.swwwrwwws..', '.swwwwwwws..', '...wwwww....', '...NNNNN....', '....NNN.....', '....NNN.....', '....kkk.....',
  ],
  chefHead: CHEF_HEAD,
  cuy: [
    '..bb....bb..', '.bBbbbbbbBb.', '.bbwwbbwwbb.', '.bbwkbbkwbb.', 'bbbbbmmbbbbb', 'bbbbwwwwbbbb', 'bbbbbbbbbbbb',
    '.bbbbbbbbbb.', '..b..bb..b..',
  ],
  // --- utilería ---
  basket: [
    'bbbbbbbbbbbbbbbb', 'bYbYbYbYbYbYbYbY', '.bbbbbbbbbbbbbb.', '.bYbYbYbYbYbYbY.', '..bbbbbbbbbbbb..', '..BBBBBBBBBBBB..',
  ],
  coin: ['..yyyy..', '.yyyyYy.', 'yywyyyYy', 'ywyyyyYy', 'ywyyyyYy', 'yyyyyyYy', '.yyyYYy.', '..yyyy..'],
  star: [
    '.....y.....', '....yyy....', 'yyyyywyyyyy', '.yyyyyyyyy.', '..yyyyyyy..', '..yyyYyyy..', '.yyY...Yyy.', '.yY.....Yy.',
  ],
  heart: ['.rr..rr.', 'rwrrrrrr', 'rrrrrrrr', 'rrrrrrrR', '.rrrrrR.', '..rrrR..', '...rR...'],
  pot: [
    '....nnnn....', '..nnnnnnnn..', 'NnnnnnnnnnnN', 'N.NNNNNNNN.N', '..NnnnnnnN..', '..NnnnnnnN..', '..NnnnnnnN..', '...NNNNNN...',
  ],
  grater: ['.nnnnnn.', 'nNnNnNnn', 'nnnnnnnn', 'nNnNnNnn', 'nnnnnnnn', 'nNnNnNnn', 'nnnnnnnn', 'N......N'],
  knife: ['nnnnnnnn.....', 'nwwwwwwwnBBBB', '.nnnnnnnnBBBB'],
  car: [
    '..cccc..', '.cccccc.', 'nccwwccn', 'nccwwccn', '.cccccc.', '.cccccc.', '.cwwwwc.', 'nccccccn', 'nccccccn', '.cccccc.',
  ],
  cone: ['...o...', '..ooo..', '..www..', '.ooooo.', '.ooooo.', 'wwwwwww', 'ooooooo'],
  oil: ['..NNNN....', '.NkkkkNN..', 'NkkkkkkkN.', '.NkwkkkN..', '..NNNN....'],
  boost: ['...yy...', '..yyyy..', '.yyyyyy.', 'yyyyyyyy', '...yy...', '...yy...'],
}

// Variantes por recoloreado
export const SWAPS = {
  rotten: { c: 'l', C: 'G', w: 'p' }, // pescado malogrado
  goldCuy: { b: 'y', B: 'Y' },
}

const canvasCache = new Map()
const urlCache = new Map()
const cacheKey = (name, swap) => (swap ? `${name}|${JSON.stringify(swap)}` : name)

/** Devuelve un <canvas> 1:1 con el sprite y su contorno. */
export function getSprite(name, swap) {
  const key = cacheKey(name, swap)
  if (canvasCache.has(key)) return canvasCache.get(key)
  const rows = SPRITES[name]
  if (!rows) throw new Error(`Sprite desconocido: ${name}`)
  const w = Math.max(...rows.map((r) => r.length)) + 2
  const h = rows.length + 2
  const grid = Array.from({ length: h }, () => Array(w).fill(null))
  rows.forEach((row, y) =>
    [...row].forEach((ch, x) => {
      if (ch === '.' || ch === ' ') return
      const c = swap?.[ch] ?? ch
      grid[y + 1][x + 1] = PALETTE[c] ?? c
    }),
  )
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  const filled = (x, y) => x >= 0 && y >= 0 && x < w && y < h && grid[y][x]
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const color = grid[y][x] || (filled(x - 1, y) || filled(x + 1, y) || filled(x, y - 1) || filled(x, y + 1) ? OUTLINE : null)
      if (color) {
        ctx.fillStyle = color
        ctx.fillRect(x, y, 1, 1)
      }
    }
  }
  canvasCache.set(key, canvas)
  return canvas
}

export function spriteURL(name, swap) {
  const key = cacheKey(name, swap)
  if (!urlCache.has(key)) urlCache.set(key, getSprite(name, swap).toDataURL())
  return urlCache.get(key)
}

/** Dibuja un sprite centrado en (cx, cy) con escala entera. */
export function drawSprite(ctx, name, cx, cy, scale = 1, swap) {
  const s = getSprite(name, swap)
  ctx.drawImage(s, Math.round(cx - (s.width * scale) / 2), Math.round(cy - (s.height * scale) / 2), s.width * scale, s.height * scale)
}
