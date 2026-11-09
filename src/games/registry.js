import { lazy } from 'react'

/**
 * REGISTRO DE JUEGOS
 * ------------------------------------------------------------
 * Para agregar un juego nuevo:
 *  1. Crear el componente en src/games/MiJuego.jsx que reciba
 *     ({ onFinish, room }) y llame onFinish({ score, stats }) al terminar.
 *  2. Agregarlo aquí con status: 'ready'.
 *
 * mode: 'solo'  -> 1 jugador, puntaje al ranking.
 * mode: 'multi' -> juego por mesa. Recibirá `room` (ver services/rooms)
 *                  para sincronizar jugadores de la misma mesa.
 */
export const games = [
  {
    id: 'memoria',
    name: 'Memoria',
    tagline: 'Encuentra las parejas',
    icon: '🃏',
    color: '#ff6b8b',
    mode: 'solo',
    status: 'ready',
    duration: '90 s',
    howTo: [
      'Toca dos cartas para voltearlas.',
      'Si son iguales, quedan descubiertas.',
      'Termina rápido y con pocos intentos para sumar más puntos.',
    ],
    Component: lazy(() => import('./MemoryGame')),
  },
  {
    id: 'trivia',
    name: 'Trivia rápida',
    tagline: 'Peruanidad y cultura general',
    icon: '❓',
    color: '#5eead4',
    mode: 'solo',
    status: 'ready',
    duration: '8 preguntas',
    howTo: [
      '8 preguntas, 4 alternativas cada una.',
      'Tienes 12 segundos por pregunta.',
      'Mientras más rápido aciertes, más puntos ganas.',
    ],
    Component: lazy(() => import('./TriviaGame')),
  },
  {
    id: 'reflejos',
    name: 'Reflejos',
    tagline: 'Atrapa los ingredientes',
    icon: '⚡',
    color: '#ffb547',
    mode: 'solo',
    status: 'ready',
    duration: '30 s',
    howTo: [
      'Toca los ingredientes antes de que desaparezcan.',
      'Las ⭐ valen 100 puntos. ¡Evita las 💣!',
      'Encadena aciertos para multiplicar tu combo.',
    ],
    Component: lazy(() => import('./ReflexGame')),
  },

  // ----- FUTUROS (multijugador por mesa) -----
  {
    id: 'duelo-mesa',
    name: 'Duelo de mesa',
    tagline: 'Reta a quien está a tu lado',
    icon: '⚔️',
    color: '#c084fc',
    mode: 'multi',
    status: 'coming-soon',
  },
  {
    id: 'trivia-grupal',
    name: 'Trivia grupal',
    tagline: 'Toda la mesa responde a la vez',
    icon: '👥',
    color: '#60a5fa',
    mode: 'multi',
    status: 'coming-soon',
  },
]

export const getGame = (id) => games.find((g) => g.id === id)
export const gameName = (id) => getGame(id)?.name ?? id
export const gameIcon = (id) => getGame(id)?.icon ?? '🎮'
export const playableGames = games.filter((g) => g.status === 'ready')
