/**
 * PUNTO DE ENTRADA DEL BACKEND — la interfaz SOLO importa desde aquí.
 *  - Con VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY → Supabase (ranking real compartido)
 *  - Sin ellas → backend local de demostración (localStorage, solo este dispositivo)
 */
import { restaurant } from '../../config/restaurant'
import { createLocalBackend } from './localBackend'
import { createSupabaseBackend } from './supabaseBackend'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const backend = url && anonKey ? createSupabaseBackend({ restaurant, url, anonKey }) : createLocalBackend({ restaurant })

/** true solo cuando hay un backend real compartido entre celulares. */
export const isSharedBackend = backend.kind === 'supabase'
