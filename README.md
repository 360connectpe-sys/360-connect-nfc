# 360 CONNECT · Mesa digital (MVP)

Prototipo de la experiencia que vive el cliente al acercar su celular a la **placa NFC/QR** de su mesa.
Restaurante ficticio de demostración: **Casa Nativa** (Miraflores, Lima), **Mesa 04**.

Stack: **React 19 + Vite + Tailwind CSS 4 + Lucide Icons**. Sin servidor propio y listo para **GitHub Pages**.

---

## 1. Ejecutar en tu computadora

Requisito: [Node.js 20 o superior](https://nodejs.org).

```bash
npm install
npm run dev
```

Abre la URL que aparece (ej. `http://localhost:5173`). Como el servidor arranca con `--host`, también verás una URL de red
(ej. `http://192.168.1.20:5173`). Ábrela **desde tu celular** (conectado al mismo Wi-Fi) para probar en un teléfono real.

Otros comandos:

```bash
npm run build     # genera la versión de producción en /dist
npm run preview   # sirve /dist para revisarla
```

### Simular distintas mesas
Cada placa NFC/QR apunta a la misma web con un parámetro distinto:

```
https://360connectpe-sys.github.io/360-connect-nfc/?mesa=04
https://360connectpe-sys.github.io/360-connect-nfc/?mesa=12
```

## 2. Publicar en GitHub Pages (gratis)

1. Crea un repositorio en GitHub (`360-connect-nfc`) y sube este proyecto a la rama `main`:
   ```bash
   git init && git add . && git commit -m "MVP 360 Connect"
   git branch -M main
   git remote add origin https://github.com/360connectpe-sys/360-connect-nfc.git
   git push -u origin main
   ```
2. En GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. El workflow incluido (`.github/workflows/deploy.yml`) compila y publica la web automáticamente en cada `push`.
   En 1–2 minutos estará en `https://360connectpe-sys.github.io/360-connect-nfc/`.
4. Graba esa URL (con `?mesa=XX`) en cada placa NFC y genera el QR con la misma dirección.

> El proyecto usa rutas relativas (`base: './'`) y navegación con `#`, así que funciona en cualquier subcarpeta sin configurar nada más.

## 3. ¿Qué es real y qué es simulado?

| Función | Estado | Detalle |
|---|---|---|
| Pantalla principal, mesa, accesos rápidos | ✅ Real | La mesa se lee de la URL (`?mesa=07`) |
| Menú digital por categorías | ✅ Real | Datos ficticios en `src/data/menu.js` |
| Botones de Instagram, TikTok, Facebook, WhatsApp y Maps | ✅ Real | Abren los enlaces configurados (de ejemplo por ahora) |
| Wi-Fi: ver y copiar la contraseña | ✅ Real | Credenciales ficticias |
| Promociones | ✅ Real (visual) | Datos ficticios. No hay canje |
| Tarjeta de sellos para clientes frecuentes | 🟡 Simulado | Muestra 6/10 sellos fijos |
| 3 juegos (Memoria, Trivia, Reflejos) | ✅ Real | Funcionan con toque en el celular, con sonido y vibración |
| Apodo del jugador | ✅ Real | Se guarda en el celular |
| Registro automático del puntaje | ✅ Real, **solo en este dispositivo** | localStorage |
| Ranking semanal con podio | 🟡 Parcial | Calcula de verdad la semana (lunes 00:00), pero solo con partidas de este celular más 9 jugadores de ejemplo |
| Premios para el top 3 | 🟡 Visual | Configurables. Sin validación ni canje automático |
| Pantalla de conexión NFC | 🟡 Simulado | Es una animación. El NFC real lo da la placa, que solo abre la URL |
| Multijugador por mesa | 🔜 Estructura lista | `services/rooms/roomService.js` (salas por mesa) |
| Ranking compartido (Supabase) | 🔜 Código listo, sin activar | `services/scores/supabaseScoreRepository.js` |
| Estadísticas | 🟡 Simulado | `services/analytics.js` cuenta eventos en el celular |
| Pedidos y pagos | ❌ No incluido | Fuera del alcance del MVP |

### Importante sobre localStorage
`localStorage` guarda datos **dentro del navegador de cada celular**. Por eso:
- El ranking que ve un cliente solo incluye **sus propias partidas** (más los jugadores demo).
- **No** se comparte entre mesas ni entre clientes, y se pierde si el cliente borra los datos del navegador.

Sirve para la demo. Para un ranking real compartido hace falta una base de datos (ver sección 5).

## 4. Personalizar para otro restaurante

| Qué cambiar | Archivo |
|---|---|
| Nombre, textos, mesa por defecto, enlaces, Wi-Fi, **premios** y condiciones | `src/config/restaurant.js` |
| Platos, precios y fotos | `src/data/menu.js` |
| Promociones y fidelización | `src/data/promos.js` |
| Preguntas de trivia (la 1.ª opción es la correcta) | `src/data/trivia.js` |
| Colores y tipografías | `src/index.css` (bloque `@theme`) |

Las fotos actuales son referenciales (Unsplash). Coloca las fotos reales en `public/img/` y usa `./img/lomo.jpg`.
Si una foto no carga, se muestra automáticamente un fondo con emoji.

## 5. Ranking compartido con Supabase (siguiente etapa)

1. Crea un proyecto gratuito en [supabase.com](https://supabase.com).
2. En **SQL Editor**, ejecuta el SQL que está en el comentario de `src/services/scores/supabaseScoreRepository.js`.
3. Copia `.env.example` a `.env` y completa `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` (Project Settings → API).
4. `npm run build`. La app detecta las variables y usa Supabase sin cambiar nada en la interfaz.
   (Para GitHub Actions, agrega esas variables como *secrets* y pásalas en el paso `npm run build`.)

> Este adaptador está escrito pero **no se ha probado contra una base real**. Para producción, valida los puntajes en una Edge Function para evitar trampas.

Para usar Firebase en su lugar, crea `firebaseScoreRepository.js` con la misma interfaz (`addScore`, `getLeaderboard`, `clear`).

## 6. Estructura del proyecto

```
src/
├── config/restaurant.js        ← configuración del restaurante (multi-restaurante a futuro)
├── data/                       ← menú, promos y trivia (luego vendrán del panel admin)
├── context/AppContext.jsx      ← mesa, navegación, apodo y avisos
├── pages/                      ← Inicio, Menú, Promos, Conecta, Juegos, Ranking, Premios
├── games/
│   ├── registry.js             ← lista de juegos (solo / multi, listo / próximamente)
│   ├── GameShell.jsx           ← intro → 3-2-1 → partida → resultado + guardado en ranking
│   ├── MemoryGame.jsx · TriviaGame.jsx · ReflexGame.jsx
├── services/
│   ├── scores/                 ← ranking: localStorage hoy, Supabase mañana (misma interfaz)
│   ├── rooms/roomService.js    ← salas por mesa para multijugador
│   └── analytics.js            ← eventos (visitas, partidas, clics en redes)
└── components/                 ← barra inferior, imágenes, modal de apodo, iconos
```

**Agregar un juego:** crea `src/games/MiJuego.jsx` que reciba `{ onFinish }` y llame
`onFinish({ score, stats: [['Etiqueta', valor]] })`. Después regístralo en `registry.js`.
El intro, la cuenta regresiva, el guardado y la pantalla de resultados ya los resuelve `GameShell`.

### Puntuación (equilibrada para un ranking general)
- **Memoria:** 800 + 15 pts por cada segundo bajo 60 s − 10 pts por cada intento extra (≈ 1 000–1 700).
- **Trivia:** 100 + 10 pts por cada segundo restante en cada acierto (máx. ≈ 1 760).
- **Reflejos:** 10 + 2×combo por ingrediente, ⭐ = 100, 💣 = −50.

## 7. Hoja de ruta sugerida
1. Ranking compartido (Supabase) → **ranking real entre todas las mesas**.
2. Panel administrativo: editar menú, promos y premios. Ver el top 3 y marcar premios como canjeados.
3. Validación de premios con un código QR único por ganador.
4. Multijugador por mesa (Supabase Realtime sobre `roomService`).
5. Estadísticas: escaneos por mesa, horarios y secciones más vistas.
6. Multi-restaurante: un `restaurant.id` por cliente y configuración cargada desde la base de datos.
