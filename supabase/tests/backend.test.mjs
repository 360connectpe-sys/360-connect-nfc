// Pruebas del backend SQL con PGlite (PostgreSQL en WebAssembly). Ejecutar: npm run test:db
import { PGlite } from '@electric-sql/pglite'
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto'
import fs from 'node:fs'
const db = new PGlite({ extensions: { pgcrypto } })
const sql = fs.readFileSync(new URL('../migrations/001_init.sql', import.meta.url), 'utf8')
await db.exec(`create role anon; create role authenticated; create schema auth;
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;`)
await db.exec(sql)
console.log('✓ migración aplicada')
const A = '11111111-1111-1111-1111-111111111111', B = '22222222-2222-2222-2222-222222222222', STAFF = '99999999-9999-9999-9999-999999999999'
const as = (uid) => db.query(`select set_config('request.jwt.claim.sub', $1, false)`, [uid])
const q = async (s, p = []) => (await db.query(s, p)).rows
const expectErr = async (label, fn) => { try { await fn(); console.log('✗ NO falló:', label) } catch (e) { console.log('✓', label, '→', e.message) } }
const ok = (label, cond, extra='') => console.log(cond ? '✓' : '✗', label, extra)

// Registro
await as(A); const [pa] = await q(`select * from register_player('casa-nativa','  lucía ','ramírez')`)
ok('registro normaliza nombre', pa.first_name === 'Lucía' && pa.last_name === 'Ramírez', `${pa.first_name} ${pa.last_name}`)
const [pa2] = await q(`select * from register_player('casa-nativa','Otro','Nombre')`)
ok('no se puede renombrar perfil existente', pa2.first_name === 'Lucía')
await as(B); await q(`select register_player('casa-nativa','Lucía','Ramírez')`)
const [{ n }] = await q(`select count(*)::int n from players`); ok('mismo nombre = jugadores distintos', n === 2)
await expectErr('nombre con números rechazado', () => q(`select register_player('casa-nativa','R2D2','X')`))

// Sesiones memoria
await as(A)
const [{ start_game_session: s1 }] = await q(`select start_game_session('casa-nativa','memoria')`)
await q(`update game_sessions set started_at = now() - interval '33 seconds' where id = $1`, [s1])
// memoryScore(errors=3, seconds=30) = 5000-450-900+300 = 3950
let [{ submit_game_session: r1 }] = await q(`select submit_game_session($1, 3950, '{"pairs":8,"moves":11,"errors":3,"seconds":30}')`, [s1])
ok('partida válida aceptada', r1.accepted && r1.rank === 1, JSON.stringify(r1))
;[{ submit_game_session: r1 }] = await q(`select submit_game_session($1, 3950, '{"pairs":8,"moves":11,"errors":3,"seconds":30}')`, [s1])
ok('envío duplicado rechazado', !r1.accepted, r1.reason)
const [{ start_game_session: s2 }] = await q(`select start_game_session('casa-nativa','memoria')`)
await q(`update game_sessions set started_at = now() - interval '33 seconds' where id = $1`, [s2])
;[{ submit_game_session: r1 }] = await q(`select submit_game_session($1, 99999, '{"pairs":8,"moves":11,"errors":3,"seconds":30}')`, [s2])
ok('puntaje inventado rechazado', !r1.accepted, r1.reason)
const [{ start_game_session: s3 }] = await q(`select start_game_session('casa-nativa','memoria')`)
;[{ submit_game_session: r1 }] = await q(`select submit_game_session($1, 3950, '{"pairs":8,"moves":11,"errors":3,"seconds":30}')`, [s3])
ok('partida "demasiado rápida" (sesión de 0 s) rechazada', !r1.accepted, r1.reason)
await expectErr('juego casual no abre sesión de ranking', () => q(`select start_game_session('casa-nativa','serpiente')`))

// Chef: log ccc ccc c x c  => 100*3 + 200*3 + 300 = 1200, -50 => 1150, +100 => 1250
await as(B)
const [{ start_game_session: c1 }] = await q(`select start_game_session('casa-nativa','chef-frenetico')`)
await q(`update game_sessions set started_at = now() - interval '48 seconds' where id = $1`, [c1])
;[{ submit_game_session: r1 }] = await q(`select submit_game_session($1, 1250, '{"log":"ccccccc xc"}'::jsonb)`, [c1]).catch(e => [{ submit_game_session: { accepted: false, reason: e.message } }])
ok('log con espacio inválido rechazado', !r1.accepted, r1.reason)
const [{ start_game_session: c2 }] = await q(`select start_game_session('casa-nativa','chef-frenetico')`)
await q(`update game_sessions set started_at = now() - interval '48 seconds' where id = $1`, [c2])
;[{ submit_game_session: r1 }] = await q(`select submit_game_session($1, 1250, '{"log":"cccccccxc"}')`, [c2])
ok('chef: puntaje recalculado desde el log', r1.accepted, JSON.stringify(r1))

// Empate en memoria: B logra 3950 después de A → A sigue primero
const [{ start_game_session: m2 }] = await q(`select start_game_session('casa-nativa','memoria')`)
await q(`update game_sessions set started_at = now() - interval '33 seconds' where id = $1`, [m2])
await q(`select submit_game_session($1, 3950, '{"pairs":8,"moves":11,"errors":3,"seconds":30}')`, [m2])
const lb = await q(`select * from get_leaderboard('casa-nativa','memoria')`)
ok('empate: gana quien lo logró primero', lb[0].player_id === pa.id && lb.length === 2, lb.map(r => `${r.rank}.${r.first_name} ${r.score}`).join(' | '))
const [{ get_my_standing: st }] = await q(`select get_my_standing('casa-nativa','memoria')`)
ok('mi posición', st.rank === 2, JSON.stringify(st))
const [{ get_my_standing: st2 }] = await q(`select get_my_standing('casa-nativa','carrera-chef')`)
ok('mi posición sin partidas (no falla)', st2.rank === null, JSON.stringify(st2))

// Cierre de temporada: mover los mejores a la semana pasada
await q(`update weekly_bests set season = current_season() - 7`)
const [{ close_due_seasons: closed }] = await q(`select close_due_seasons()`)
ok('cierre automático genera premios', closed === 3, `${closed} premios`)
const [{ close_due_seasons: again }] = await q(`select close_due_seasons()`)
ok('cierre idempotente', again === 0)
await as(A); const awardsA = await q(`select * from get_my_awards('casa-nativa')`)
ok('ganador ve su código completo', awardsA.length === 1 && /^CN-\w{4}-\w{4}$/.test(awardsA[0].get_my_awards.code), awardsA[0].get_my_awards.code)
const code = awardsA[0].get_my_awards.code
const hist = await q(`select get_season_history('casa-nativa','memoria')`)
ok('historial de ganadores', hist[0].get_season_history[0].winners.length === 2, JSON.stringify(hist[0].get_season_history[0].winners))

// Personal
await expectErr('jugador no puede verificar premios', () => q(`select staff_verify_prize('casa-nativa',$1)`, [code]))
await expectErr('jugador no puede llamar close_season (función interna)', async () => { await db.exec(`set role authenticated`); try { await q(`select close_season('casa-nativa', current_season()-14)`) } finally { await db.exec(`reset role`) } })
await expectErr('jugador no puede leer prize_awards directo (RLS)', async () => { await db.exec(`set role authenticated`); try { const r = await q(`select * from prize_awards`); if (r.length === 0) throw new Error('0 filas visibles') } finally { await db.exec(`reset role`) } })
await q(`insert into staff values ($1,'casa-nativa','Carla (caja)','staff')`, [STAFF])
await as(STAFF)
const [{ staff_verify_prize: v }] = await q(`select staff_verify_prize('casa-nativa', lower($1))`, [code])
ok('personal verifica código', v.winner_name === 'Lucía Ramírez' && v.status === 'pending', `${v.winner_name} · ${v.prize_title}`)
const [{ staff_redeem_prize: red }] = await q(`select staff_redeem_prize('casa-nativa',$1)`, [code])
ok('canje', red.status === 'redeemed' && red.redeemed_by === 'Carla (caja)')
const [{ staff_redeem_prize: dup }] = await q(`select staff_redeem_prize('casa-nativa',$1)`, [code]); ok('doble canje bloqueado', !!dup.error, dup.error)
const [{ staff_redeem_prize: nf }] = await q(`select staff_redeem_prize('casa-nativa','CN-AAAA-BBBB')`); ok('código inexistente', nf.error === 'Código no encontrado')
const list = await q(`select * from staff_list_awards('casa-nativa')`)
ok('listado del personal con códigos enmascarados', list.every(r => r.staff_list_awards.code.includes('••')), list[0].staff_list_awards.code)
const [{ c: audits }] = await q(`select count(*)::int c from prize_audit`)
ok('auditoría registrada', audits >= 3, `${audits} eventos`)
await expectErr('otro restaurante no ve el premio', async () => { await q(`insert into restaurants values ('otro-rest','Otro','OR',false,array['memoria','duelo','serpiente','travieso'])`); await q(`select staff_verify_prize('otro-rest',$1)`, [code]) })

// Configuración por restaurante
await expectErr('restaurante real con 3 juegos rechazado', () => q(`insert into restaurants values ('malo','Malo','ML',false,array['memoria','duelo','serpiente'])`))
await expectErr('juego inexistente rechazado', () => q(`insert into restaurants values ('malo2','Malo','ML',false,array['memoria','duelo','serpiente','trivia'])`))
await as(A)
await expectErr('juego no activo en el restaurante', () => q(`select start_game_session('otro-rest','chef-frenetico')`))
const [{ s }] = await q(`select current_season()::text s`); console.log('temporada actual (Lima):', s)
