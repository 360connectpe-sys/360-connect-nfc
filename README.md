# 360 CONNECT · Carta digital + Zona de juegos (MVP)

Prototipo de la experiencia que vive el cliente al acercar su celular a la **placa NFC/QR** del restaurante.
Restaurante ficticio de demostración: **Casa Nativa** (Miraflores, Lima).

Stack: **React 19 + Vite + Tailwind CSS 4 + Lucide Icons**. Frontend en **GitHub Pages**; backend opcional en **Supabase**.

Demo publicada: https://360connectpe-sys.github.io/360-connect-nfc/

---

## 1. Ejecutar en tu computadora

Requisito: [Node.js 20+](https://nodejs.org).

```bash
npm install
npm run dev
```

Abre la URL que aparece. Como arranca con `--host`, también verás una URL de red (ej. `http://192.168.1.20:5173`) para abrirla desde tu celular en el mismo Wi-Fi.

```bash
npm run build     # versión de producción en /dist
npm run preview   # sirve /dist para revisarla
```

**Sin mesas:** todas las placas del local apuntan a la misma URL. Los enlaces antiguos con `?mesa=04` siguen funcionando: el parámetro se ignora y se borra de la barra de direcciones.

## 2. Publicar en GitHub Pages

El workflow `.github/workflows/deploy.yml` publica automáticamente cada `push` a `main`
(requiere *Settings → Pages → Source: GitHub Actions*, ya configurado).

---

## 3. Catálogo de juegos (7)

| # | Juego | Tipo | Duración | Controles |
|---|---|---|---|---|
| 1 | **Memoria gastronómica** | 🏆 Ranking semanal | hasta 3 min | toque |
| 2 | **Chef Frenético** | 🏆 Ranking semanal | 45 s | deslizar · ← → |
| 3 | **Carrera del Chef** | 🏆 Ranking semanal | hasta 60 s, 3 vidas | toque / botón · ESPACIO · pausa |
| 4 | **Atrapa al Travieso** | 🎮 Récord personal | 30 s | toque |
| 5 | **Serpiente Hambrienta** | 🎮 Récord personal | sin límite | deslizar · cruceta · flechas · pausa |
| 6 | **Duelo Arcade** (interno: *Duelo de Mesa*) | ⚔️ 2 jugadores | 45 s | toque |
| 7 | **Carrera Multijugador** (interno: *Carrera de Mesa*) | ⚔️ 2–4 jugadores | 60–90 s | mantener ← → |

**Puntuación de los juegos con ranking** (reglas únicas en `src/services/backend/validation.js`, replicadas en SQL):

- **Memoria:** `5 000 − 150 × errores − 30 × segundos + bono` (bono `20 × (45 − s)` si terminas en menos de 45 s). Nunca es negativa. Solo cuenta si completas las 8 parejas.
- **Chef Frenético:** ingrediente del pedido `+100 × multiplicador`; ingrediente equivocado, zapato, bomba o pescado malogrado `−50` (mínimo 0). El multiplicador sube con cada pedido completo (x1 → x2 → x3, máximo). Un error lo devuelve a x1 y cancela el pedido.
- **Carrera del Chef:** `metros × 5 + monedas × 50 + ingredientes × 100`. La velocidad aumenta. Termina con 0 vidas o a los 60 s.

**Por restaurante:** la demo activa los 7 juegos. Un restaurante real activa **exactamente 4**
(`src/config/restaurant.js → enabledGames`, validado en `src/config/validateConfig.js` y en la base de datos).
Los juegos no activos no aparecen y tampoco abren con un enlace directo.

## 4. Registro de jugadores

- Solo se piden **nombre y apellido**. No se pide DNI, correo, contraseña, teléfono ni fecha de nacimiento.
- Cada perfil recibe un **identificador interno** (UUID). Dos personas con el mismo nombre son jugadores distintos.
- La sesión queda guardada en el dispositivo: no se vuelve a pedir el registro. "¿No eres tú?" crea otro perfil (útil si se comparte el celular).
- **Limitación importante:** el nombre **no autentica**. Cualquiera puede escribir cualquier nombre.
  Por eso los puntajes se vinculan a la **identidad del dispositivo** (en producción: usuario anónimo de Supabase Auth) y no al nombre:
  escribir el nombre de otra persona **no** da acceso a sus puntajes ni a sus premios. Si alguien borra los datos del navegador, pierde su perfil.

## 5. Ranking 2.0

- Tres rankings independientes: Memoria gastronómica, Chef Frenético y Carrera del Chef.
- Muestra el podio, el top 10 con nombre y apellido, tu posición, tu mejor puntaje semanal, tu récord personal, la cuenta regresiva y el historial de ganadores.
- **Temporadas:** de lunes 00:00:00 a domingo 23:59:59, **hora de Lima** (no la del celular). Cada lunes empieza una tabla nueva y las anteriores quedan en el historial.
- **Reglas:** solo cuentan partidas completas y válidas. Se guarda la mejor puntuación semanal por jugador y juego (no se suman intentos). En empate gana quien la logró primero. Cada partida se registra una sola vez.
- **Anti-trampa:** al empezar se abre una *sesión de juego* con la hora del servidor. Al terminar se envían las estadísticas, y el servidor **recalcula el puntaje**, verifica que el tiempo sea posible y rechaza envíos duplicados.
  Un puntaje escrito a mano desde el navegador se rechaza.

## 6. Premios y verificación con DNI físico

1. Cada domingo a las 23:59:59 (hora de Lima) cierra la temporada. El lunes 00:01 se generan los ganadores oficiales (top 3 de cada ranking).
2. Cada ganador recibe un **código de premio único y de un solo uso** (ej. `CN-7K4Q-X9MD`, válido 30 días). Lo ve en **Premios → Tus premios**. Solo el ganador ve su código completo.
3. Va al local con su **DNI físico** y el código. El personal entra a **Premios → Acceso para el personal**, verifica el código, confirma que el nombre del DNI coincide y marca el premio como entregado.
4. Un código ya canjeado o vencido no se puede volver a usar. Cada verificación y cada canje (también los rechazados) queda en la auditoría.

**Privacidad:** no se piden ni se guardan números ni fotos del DNI. La verificación es solo presencial.

## 7. ¿Qué es real y qué es simulado?

| Función | En esta demo (GitHub Pages, sin servidor) | Con Supabase activado |
|---|---|---|
| Carta, promos, redes, WhatsApp, Wi-Fi | ✅ Real | ✅ Real |
| 7 juegos jugables (táctil + teclado) | ✅ Real | ✅ Real |
| Registro nombre + apellido | ✅ Real, guardado **en este celular** | ✅ Real, en la base de datos |
| Validación de partidas | 🟡 Se ejecuta **en el navegador** (puede alterarse) | ✅ En el servidor (SQL) |
| Ranking semanal | 🟡 **Solo este celular** + jugadores de ejemplo. **No es un ranking compartido** | ✅ Compartido entre todos los clientes |
| Cierre de temporada y códigos de premio | 🟡 Automático en el celular + botón "Simular cierre" | ✅ Automático (pg_cron) |
| Panel del personal | 🟡 PIN de demo `2580` | ✅ Cuenta del personal con correo y contraseña |
| Multijugador | 🟡 Entre **pestañas del mismo navegador** + práctica contra la CPU | ✅ Entre celulares (Supabase Realtime) |
| Récords de juegos casuales | ✅ Récord personal local | ✅ igual (por diseño) |

**localStorage no comparte datos entre celulares.** Cada teléfono tiene su propio "ranking". Para que todos los clientes compitan entre sí y los premios sean reales, hay que activar Supabase (sección 8).

## 8. Activar el backend real (Supabase)

> El código del backend está **escrito y probado** contra PostgreSQL real (32 pruebas automáticas con PGlite: registro, anti-trampa, duplicados, desempates, cierre de temporada, códigos, canje único, permisos y separación de restaurantes).
> **Falta probarlo en un proyecto Supabase real**, porque crearlo requiere tu cuenta.

1. Crea un proyecto gratuito en [supabase.com](https://supabase.com) (región São Paulo, la más cercana a Lima).
2. **Authentication → Sign In / Providers →** activa **Allow anonymous sign-ins**.
3. **SQL Editor:** ejecuta `supabase/migrations/001_init.sql`. Después activa la extensión **pg_cron** (Database → Extensions) y ejecuta `002_cron.sql`.
4. **Personal:** en Authentication → Users → *Add user* crea la cuenta del personal (correo + contraseña). Luego, en SQL:
   ```sql
   insert into staff (user_id, restaurant_id, display_name) values ('<uuid-del-usuario>', 'casa-nativa', 'Carla (caja)');
   ```
5. En GitHub: *Settings → Secrets and variables → Actions → Variables*, crea `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` (Project Settings → API). Pásalas al paso `npm run build` del workflow:
   ```yaml
   - run: npm run build
     env:
       VITE_SUPABASE_URL: ${{ vars.VITE_SUPABASE_URL }}
       VITE_SUPABASE_ANON_KEY: ${{ vars.VITE_SUPABASE_ANON_KEY }}
   ```
   La clave `anon` es pública por diseño. **Nunca** uses la clave `service_role` en el frontend ni en GitHub Pages.

**Seguridad:** RLS está activado en todas las tablas. Los clientes no pueden leer ni escribir puntajes, premios o jugadores directamente, solo mediante funciones del servidor que verifican la identidad (`auth.uid()`).
Las funciones internas (cerrar temporadas, generar códigos) no se pueden llamar desde el navegador. Cada fila lleva `restaurant_id`, así que los datos de distintos restaurantes nunca se mezclan.

**Límite honesto del anti-trampa:** los juegos corren en el celular, así que un programador experto podría fabricar estadísticas *plausibles*. El servidor descarta todo lo imposible (puntajes que no cuadran, tiempos irreales, duplicados).
Además, el canje presencial con DNI y código limita el impacto. Si en el futuro se necesita más, se puede limitar la cantidad de partidas por día o pedir verificación adicional al top 3.

## 9. Personalizar para otro restaurante

| Qué cambiar | Archivo |
|---|---|
| Nombre, textos, enlaces, Wi-Fi, **juegos activos (4)**, premios | `src/config/restaurant.js` |
| Platos y fotos | `src/data/menu.js` |
| Promociones | `src/data/promos.js` |
| Colores y tipografías | `src/index.css` (`@theme`) |
| Con Supabase: juegos activos y premios | tablas `restaurants.enabled_games` y `prize_config` |

Cada restaurante tiene su propio `id`, y con él sus propios jugadores, rankings, premios y salas.

## 10. Estructura

```
src/
├── config/                  restaurante + validación (exactamente 4 juegos)
├── games/
│   ├── catalog.js           los 7 juegos (categoría, reglas, carga diferida)
│   ├── engine/              sprites pixel art 16-bit, bucle de juego en canvas
│   ├── SoloGameShell.jsx    intro → sesión → 3-2-1 → partida → validación → resultado
│   ├── solo/                Memoria · Chef Frenético · Carrera del Chef · Travieso · Serpiente
│   └── multi/               Salas (MultiplayerShell) · Duelo Arcade · Carrera Multijugador
├── services/
│   ├── backend/             interfaz única: localBackend (demo) | supabaseBackend (producción)
│   │   └── validation.js    reglas de puntuación compartidas
│   └── multiplayer/         salas por código (useRoom) + transporte (BroadcastChannel | Realtime)
├── pages/                   Inicio, Menú, Promos, Conecta, Juegos, Ranking, Premios, Personal
└── lib/season.js            temporadas en hora de Lima
supabase/migrations/         esquema SQL, RLS, funciones y cron
```

**Multijugador:** el anfitrión crea una sala con un código temporal de 5 caracteres y lo comparte (también por enlace, con el código ya incluido). Todos marcan "listo", el anfitrión inicia y todos los celulares reciben la misma **semilla**, así ven los mismos objetivos y el mismo circuito.
Los latidos cada 2 s detectan desconexiones (7 s sin latido = desconectado). La revancha devuelve a todos a la sala.
