-- =====================================================================
-- 360 CONNECT · Esquema inicial (Supabase / PostgreSQL 15+)
-- Jugadores · sesiones de juego validadas · ranking semanal (America/Lima)
-- premios con código único · canje por el personal · multi-restaurante
--
-- Ejecutar en: Supabase → SQL Editor (o `supabase db push`).
-- Requisitos: Authentication → Sign In / Providers → "Allow anonymous sign-ins" = ON
--
-- Modelo de seguridad:
--   * RLS activado en TODAS las tablas. Los clientes solo leen catálogo,
--     restaurantes y premios configurados. Todo lo demás pasa por funciones
--     SECURITY DEFINER que verifican auth.uid() y validan los datos.
--   * El puntaje nunca se inserta directo: se abre una sesión (hora del
--     servidor) y al enviar se RECALCULA desde las estadísticas.
--   * Verificar y canjear premios: solo cuentas listadas en `staff`.
--   * Cada fila lleva restaurant_id: los datos de restaurantes no se mezclan.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Catálogo de juegos (7)
-- ---------------------------------------------------------------------
create table public.games (
  id text primary key,
  name text not null,
  category text not null check (category in ('ranked', 'casual', 'multi'))
);
insert into public.games (id, name, category) values
  ('memoria', 'Memoria gastronómica', 'ranked'),
  ('chef-frenetico', 'Chef Frenético', 'ranked'),
  ('carrera-chef', 'Carrera del Chef', 'ranked'),
  ('travieso', 'Atrapa al Travieso', 'casual'),
  ('serpiente', 'Serpiente Hambrienta', 'casual'),
  ('duelo', 'Duelo Arcade', 'multi'),
  ('carrera-multi', 'Carrera Multijugador', 'multi');

-- ---------------------------------------------------------------------
-- Restaurantes (demo: cualquier cantidad · reales: exactamente 4 juegos)
-- ---------------------------------------------------------------------
create table public.restaurants (
  id text primary key check (id ~ '^[a-z0-9-]{3,40}$'),
  name text not null,
  initials text not null check (initials ~ '^[A-Z]{2,4}$'),
  is_demo boolean not null default false,
  enabled_games text[] not null,
  prize_validity_days int not null default 30 check (prize_validity_days between 1 and 365),
  created_at timestamptz not null default now()
);

create function public.check_enabled_games() returns trigger
language plpgsql as $$
begin
  if exists (select 1 from unnest(new.enabled_games) g where g not in (select id from public.games)) then
    raise exception 'enabled_games contiene un juego desconocido';
  end if;
  if (select count(distinct g) from unnest(new.enabled_games) g) <> cardinality(new.enabled_games) then
    raise exception 'enabled_games tiene juegos repetidos';
  end if;
  if not new.is_demo and cardinality(new.enabled_games) <> 4 then
    raise exception 'Un restaurante real debe activar exactamente 4 juegos (tiene %)', cardinality(new.enabled_games);
  end if;
  return new;
end $$;

create trigger trg_check_enabled_games
  before insert or update on public.restaurants
  for each row execute function public.check_enabled_games();

create table public.prize_config (
  restaurant_id text not null references public.restaurants on delete cascade,
  place int not null check (place between 1 and 10),
  title text not null,
  description text,
  emoji text,
  primary key (restaurant_id, place)
);

-- ---------------------------------------------------------------------
-- Jugadores: identidad = usuario anónimo de Supabase Auth (auth.uid()).
-- Nombre y apellido NO autentican; solo se muestran en el ranking.
-- No se almacena DNI, correo, teléfono ni fecha de nacimiento.
-- ---------------------------------------------------------------------
create table public.players (
  id uuid primary key default gen_random_uuid(),
  restaurant_id text not null references public.restaurants on delete cascade,
  auth_uid uuid not null,
  first_name text not null check (first_name ~ '^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ'' -]{2,30}$'),
  last_name text not null check (last_name ~ '^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ'' -]{2,30}$'),
  created_at timestamptz not null default now(),
  unique (restaurant_id, auth_uid)
);

create table public.staff (
  user_id uuid not null,                       -- auth.users.id (cuenta con email/contraseña)
  restaurant_id text not null references public.restaurants on delete cascade,
  display_name text not null,
  role text not null default 'staff' check (role in ('staff', 'admin')),
  primary key (user_id, restaurant_id)
);

-- ---------------------------------------------------------------------
-- Sesiones de juego y ranking
-- ---------------------------------------------------------------------
create table public.game_sessions (
  id uuid primary key default gen_random_uuid(),
  restaurant_id text not null references public.restaurants on delete cascade,
  player_id uuid not null references public.players on delete cascade,
  game_id text not null references public.games,
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  score int,
  stats jsonb,
  status text not null default 'started' check (status in ('started', 'accepted', 'rejected')),
  reject_reason text
);
create index game_sessions_player_idx on public.game_sessions (player_id, started_at desc);

-- Mejor puntaje por jugador · juego · temporada (no se suman intentos)
create table public.weekly_bests (
  restaurant_id text not null references public.restaurants on delete cascade,
  game_id text not null references public.games,
  season date not null,                        -- lunes de la semana (hora de Lima)
  player_id uuid not null references public.players on delete cascade,
  score int not null check (score >= 0),
  achieved_at timestamptz not null,
  session_id uuid not null unique references public.game_sessions,
  primary key (restaurant_id, game_id, season, player_id)
);
create index weekly_bests_rank_idx on public.weekly_bests (restaurant_id, game_id, season, score desc, achieved_at asc);

create table public.seasons_closed (
  restaurant_id text not null references public.restaurants on delete cascade,
  season date not null,
  closed_at timestamptz not null default now(),
  primary key (restaurant_id, season)
);

create table public.prize_awards (
  id uuid primary key default gen_random_uuid(),
  restaurant_id text not null references public.restaurants on delete cascade,
  season date not null,
  game_id text not null references public.games,
  place int not null,
  player_id uuid not null references public.players on delete cascade,
  winner_name text not null,                   -- copia del nombre al cierre (no cambia después)
  score int not null,
  prize_title text not null,
  code text not null unique,
  status text not null default 'pending' check (status in ('pending', 'redeemed')),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  redeemed_at timestamptz,
  redeemed_by uuid,
  redeemed_by_name text,
  unique (restaurant_id, season, game_id, place)
);

create table public.prize_audit (
  id bigint generated always as identity primary key,
  restaurant_id text not null,
  staff_uid uuid not null,
  action text not null check (action in ('verify', 'redeem', 'redeem_denied')),
  code text not null,
  at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- RLS: lectura pública solo de configuración. Nada se escribe directo.
-- ---------------------------------------------------------------------
alter table public.games enable row level security;
alter table public.restaurants enable row level security;
alter table public.prize_config enable row level security;
alter table public.players enable row level security;
alter table public.staff enable row level security;
alter table public.game_sessions enable row level security;
alter table public.weekly_bests enable row level security;
alter table public.seasons_closed enable row level security;
alter table public.prize_awards enable row level security;
alter table public.prize_audit enable row level security;

create policy "catalogo publico" on public.games for select using (true);
create policy "restaurantes publicos" on public.restaurants for select using (true);
create policy "premios publicos" on public.prize_config for select using (true);
create policy "temporadas publicas" on public.seasons_closed for select using (true);
-- players, staff, game_sessions, weekly_bests, prize_awards, prize_audit:
-- sin políticas => sin acceso directo. Solo mediante las funciones de abajo.

-- ---------------------------------------------------------------------
-- Utilidades
-- ---------------------------------------------------------------------
create function public.current_season() returns date
language sql stable as $$
  select (date_trunc('week', now() at time zone 'America/Lima'))::date
$$;

create function public.my_player_id(p_restaurant text) returns uuid
language sql stable security definer set search_path = public as $$
  select id from players where restaurant_id = p_restaurant and auth_uid = auth.uid()
$$;

create function public.is_staff(p_restaurant text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from staff where user_id = auth.uid() and restaurant_id = p_restaurant)
$$;

create function public.gen_prize_code(p_prefix text) returns text
language plpgsql volatile set search_path = public, extensions as $$
declare
  alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  b bytea := gen_random_bytes(8);
  s text := '';
begin
  for i in 0..7 loop
    s := s || substr(alphabet, (get_byte(b, i) % 31) + 1, 1);
    if i = 3 then s := s || '-'; end if;
  end loop;
  return p_prefix || '-' || s;
end $$;

-- ---------------------------------------------------------------------
-- VALIDACIÓN DE PARTIDAS (réplica de src/services/backend/validation.js)
-- Devuelve NULL si es válida, o el motivo del rechazo.
-- ---------------------------------------------------------------------
create function public.validate_submission(p_game text, p_score int, p_stats jsonb, p_elapsed numeric)
returns text language plpgsql immutable as $$
declare
  v_errors int; v_moves int; v_pairs int; v_seconds int; v_meters int; v_coins int; v_ing int;
  v_log text; v_calc int := 0; v_streak int := 0; ch text;
begin
  if p_score is null or p_score < 0 or p_score > 100000 then return 'Puntaje fuera de rango'; end if;
  if p_stats is null or jsonb_typeof(p_stats) <> 'object' then return 'Faltan estadísticas de la partida'; end if;

  begin
    if p_game = 'memoria' then
      v_pairs := (p_stats->>'pairs')::int; v_moves := (p_stats->>'moves')::int;
      v_errors := (p_stats->>'errors')::int; v_seconds := (p_stats->>'seconds')::int;
      if v_pairs is distinct from 8 then return 'Partida incompleta'; end if;
      if v_errors is null or v_errors < 0 or v_errors > 500 or v_moves is distinct from 8 + v_errors then return 'Movimientos inconsistentes'; end if;
      if v_seconds is null or v_seconds < 6 or v_seconds > 180 then return 'Tiempo inválido'; end if;
      if p_elapsed < v_seconds - 2 or p_elapsed > v_seconds + 300 then return 'Duración no coincide con la sesión'; end if;
      v_calc := greatest(0, round(5000 - v_errors * 150 - v_seconds * 30
                 + case when v_seconds < 45 then (45 - v_seconds) * 20 else 0 end));
      if p_score <> v_calc then return 'El puntaje no coincide'; end if;
      return null;

    elsif p_game = 'chef-frenetico' then
      v_log := p_stats->>'log';
      if v_log is null or v_log !~ '^[cx]*$' or length(v_log) > 150 then return 'Registro de jugadas inválido'; end if;
      if p_elapsed < 44 or p_elapsed > 345 then return 'Duración no coincide con la sesión'; end if;
      foreach ch in array regexp_split_to_array(v_log, '') loop
        if ch = 'c' then
          v_calc := v_calc + 100 * least(3, 1 + v_streak / 3);
          v_streak := v_streak + 1;
        elsif ch = 'x' then
          v_calc := greatest(0, v_calc - 50);
          v_streak := 0;
        end if;
      end loop;
      if p_score <> v_calc then return 'El puntaje no coincide'; end if;
      return null;

    elsif p_game = 'carrera-chef' then
      v_seconds := (p_stats->>'seconds')::int; v_meters := (p_stats->>'meters')::int;
      v_coins := (p_stats->>'coins')::int; v_ing := (p_stats->>'ingredients')::int;
      if v_seconds is null or v_seconds < 1 or v_seconds > 61 then return 'Tiempo inválido'; end if;
      if v_meters is null or v_meters < 0 or v_meters > ceil(v_seconds * 170 / 10.0) + 5 then return 'Distancia imposible'; end if;
      if v_coins is null or v_coins < 0 or v_coins > v_seconds * 4 or v_ing is null or v_ing < 0 or v_ing > v_seconds then return 'Objetos imposibles'; end if;
      if p_elapsed < v_seconds - 2 or p_elapsed > v_seconds + 900 then return 'Duración no coincide con la sesión'; end if;
      if p_score <> v_meters * 5 + v_coins * 50 + v_ing * 100 then return 'El puntaje no coincide'; end if;
      return null;
    end if;
  exception when others then
    return 'Estadísticas inválidas';
  end;
  return 'Este juego no participa en el ranking';
end $$;

-- ---------------------------------------------------------------------
-- JUGADORES
-- ---------------------------------------------------------------------
create function public.get_my_player(p_restaurant text) returns public.players
language sql stable security definer set search_path = public as $$
  select * from players where restaurant_id = p_restaurant and auth_uid = auth.uid()
$$;

create function public.register_player(p_restaurant text, p_first_name text, p_last_name text)
returns public.players language plpgsql security definer set search_path = public as $$
declare v players;
begin
  if auth.uid() is null then raise exception 'Sin sesión'; end if;
  insert into players (restaurant_id, auth_uid, first_name, last_name)
  values (p_restaurant, auth.uid(),
          initcap(regexp_replace(trim(p_first_name), '\s+', ' ', 'g')),
          initcap(regexp_replace(trim(p_last_name), '\s+', ' ', 'g')))
  on conflict (restaurant_id, auth_uid) do nothing;   -- no se puede renombrar un perfil existente
  select * into v from players where restaurant_id = p_restaurant and auth_uid = auth.uid();
  return v;
end $$;

-- ---------------------------------------------------------------------
-- SESIONES DE JUEGO
-- ---------------------------------------------------------------------
create function public.start_game_session(p_restaurant text, p_game text) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_player uuid := my_player_id(p_restaurant); v_id uuid;
begin
  if v_player is null then raise exception 'Primero regístrate para jugar'; end if;
  if not exists (
    select 1 from restaurants r join games g on g.id = p_game
    where r.id = p_restaurant and p_game = any(r.enabled_games) and g.category = 'ranked'
  ) then raise exception 'Este juego no participa en el ranking de este restaurante'; end if;
  if (select count(*) from game_sessions where player_id = v_player and started_at > now() - interval '1 minute') >= 6 then
    raise exception 'Demasiadas partidas seguidas, espera un momento';
  end if;
  insert into game_sessions (restaurant_id, player_id, game_id) values (p_restaurant, v_player, p_game)
  returning id into v_id;
  return v_id;
end $$;

create function public.submit_game_session(p_session uuid, p_score int, p_stats jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  s game_sessions; v_reason text; v_season date := current_season();
  v_prev_best int; v_rank int; v_total int; v_season_best int; v_personal int;
begin
  select * into s from game_sessions where id = p_session for update;
  if not found or s.player_id <> my_player_id(s.restaurant_id) then
    return jsonb_build_object('accepted', false, 'reason', 'Sesión de juego inválida');
  end if;
  if s.status <> 'started' then
    return jsonb_build_object('accepted', false, 'reason', 'Esta partida ya fue registrada');
  end if;

  v_reason := validate_submission(s.game_id, p_score, p_stats, extract(epoch from now() - s.started_at));
  update game_sessions
     set submitted_at = now(), score = p_score, stats = p_stats,
         status = case when v_reason is null then 'accepted' else 'rejected' end, reject_reason = v_reason
   where id = s.id;
  if v_reason is not null then
    return jsonb_build_object('accepted', false, 'reason', v_reason);
  end if;

  select max(score) into v_prev_best from weekly_bests where player_id = s.player_id and game_id = s.game_id;

  -- Solo reemplaza si es ESTRICTAMENTE mayor (empate: gana quien lo logró primero)
  insert into weekly_bests (restaurant_id, game_id, season, player_id, score, achieved_at, session_id)
  values (s.restaurant_id, s.game_id, v_season, s.player_id, p_score, now(), s.id)
  on conflict (restaurant_id, game_id, season, player_id) do update
     set score = excluded.score, achieved_at = excluded.achieved_at, session_id = excluded.session_id
   where excluded.score > weekly_bests.score;

  select r.rnk, r.total, r.score into v_rank, v_total, v_season_best from (
    select player_id, score, row_number() over (order by score desc, achieved_at asc) as rnk, count(*) over () as total
    from weekly_bests where restaurant_id = s.restaurant_id and game_id = s.game_id and season = v_season
  ) r where r.player_id = s.player_id;
  select max(score) into v_personal from weekly_bests where player_id = s.player_id and game_id = s.game_id;

  return jsonb_build_object(
    'accepted', true, 'rank', v_rank, 'total_players', v_total, 'season_best', v_season_best,
    'personal_best', v_personal, 'is_new_best', p_score > 0 and p_score > coalesce(v_prev_best, 0)
  );
end $$;

-- ---------------------------------------------------------------------
-- RANKING (lectura pública: nombre, apellido y puntaje)
-- ---------------------------------------------------------------------
create function public.get_leaderboard(p_restaurant text, p_game text, p_season date default null, p_limit int default 10)
returns table (rank int, player_id uuid, first_name text, last_name text, score int, achieved_at timestamptz)
language sql stable security definer set search_path = public as $$
  select (row_number() over (order by w.score desc, w.achieved_at asc))::int, w.player_id, p.first_name, p.last_name, w.score, w.achieved_at
  from weekly_bests w join players p on p.id = w.player_id
  where w.restaurant_id = p_restaurant and w.game_id = p_game and w.season = coalesce(p_season, current_season())
  order by w.score desc, w.achieved_at asc
  limit least(greatest(coalesce(p_limit, 10), 1), 50)
$$;

create function public.get_my_standing(p_restaurant text, p_game text, p_season date default null) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  v_player uuid := my_player_id(p_restaurant); v_season date := coalesce(p_season, current_season());
  v_rank int; v_score int; v_personal int;
begin
  if v_player is null then return null; end if;
  select x.rnk, x.score into v_rank, v_score from (
    select player_id, score, row_number() over (order by score desc, achieved_at asc)::int as rnk
    from weekly_bests where restaurant_id = p_restaurant and game_id = p_game and season = v_season
  ) x where x.player_id = v_player;
  select max(score) into v_personal from weekly_bests where player_id = v_player and game_id = p_game;
  return jsonb_build_object('rank', v_rank, 'season_best', v_score, 'personal_best', v_personal,
    'total_players', (select count(*) from weekly_bests where restaurant_id = p_restaurant and game_id = p_game and season = v_season));
end $$;

create function public.get_season_history(p_restaurant text, p_game text, p_limit int default 6) returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(h order by h.season desc), '[]'::jsonb) from (
    select sc.season,
           coalesce((select jsonb_agg(jsonb_build_object('place', a.place, 'name', a.winner_name, 'score', a.score) order by a.place)
                     from prize_awards a where a.restaurant_id = p_restaurant and a.season = sc.season and a.game_id = p_game), '[]'::jsonb) as winners
    from seasons_closed sc where sc.restaurant_id = p_restaurant
    order by sc.season desc limit least(coalesce(p_limit, 6), 20)
  ) h
$$;

create function public.list_closed_seasons(p_restaurant text) returns setof date
language sql stable security definer set search_path = public as $$
  select season from seasons_closed where restaurant_id = p_restaurant order by season desc
$$;

-- ---------------------------------------------------------------------
-- PREMIOS
-- ---------------------------------------------------------------------
create function public.award_json(a public.prize_awards, p_mask boolean) returns jsonb
language sql stable as $$
  select jsonb_build_object(
    'code', case when p_mask then regexp_replace(a.code, '^(\w+-\w{2})\w{2}-\w{4}$', '\1••-••••') else a.code end,
    'season', a.season, 'game_id', a.game_id, 'place', a.place, 'prize_title', a.prize_title, 'score', a.score,
    'status', case when a.status = 'pending' and a.expires_at < now() then 'expired' else a.status end,
    'winner_name', a.winner_name, 'redeemed_at', a.redeemed_at, 'redeemed_by', a.redeemed_by_name, 'expires_at', a.expires_at)
$$;

-- El ganador ve SUS códigos completos (nunca los de otros)
create function public.get_my_awards(p_restaurant text) returns setof jsonb
language sql stable security definer set search_path = public as $$
  select award_json(a, false) from prize_awards a
  where a.restaurant_id = p_restaurant and a.player_id = my_player_id(p_restaurant)
  order by a.season desc, a.place
$$;

-- Cierre de temporada: top N por juego con ranking → códigos únicos
create function public.close_season(p_restaurant text, p_season date) returns int
language plpgsql security definer set search_path = public as $$
declare r restaurants; n int;
begin
  select * into r from restaurants where id = p_restaurant;
  if not found then raise exception 'Restaurante no existe'; end if;
  if p_season >= current_season() then raise exception 'La temporada aún no termina'; end if;
  insert into seasons_closed (restaurant_id, season) values (p_restaurant, p_season) on conflict do nothing;
  if not found then return 0; end if; -- ya estaba cerrada (idempotente)

  insert into prize_awards (restaurant_id, season, game_id, place, player_id, winner_name, score, prize_title, code, expires_at)
  select p_restaurant, p_season, w.game_id, w.place, w.player_id, p.first_name || ' ' || p.last_name, w.score, pc.title,
         gen_prize_code(r.initials),
         ((p_season + 7)::timestamp at time zone 'America/Lima') + make_interval(days => r.prize_validity_days)
  from (
    select wb.*, row_number() over (partition by wb.game_id order by wb.score desc, wb.achieved_at asc)::int as place
    from weekly_bests wb join games g on g.id = wb.game_id and g.category = 'ranked'
    where wb.restaurant_id = p_restaurant and wb.season = p_season and wb.game_id = any(r.enabled_games)
  ) w
  join prize_config pc on pc.restaurant_id = p_restaurant and pc.place = w.place
  join players p on p.id = w.player_id;
  get diagnostics n = row_count;
  return n;
end $$;

-- Cierra todas las temporadas vencidas de todos los restaurantes (lo llama pg_cron)
create function public.close_due_seasons() returns int
language plpgsql security definer set search_path = public as $$
declare x record; total int := 0;
begin
  for x in
    select distinct w.restaurant_id, w.season from weekly_bests w
    where w.season < current_season()
      and not exists (select 1 from seasons_closed c where c.restaurant_id = w.restaurant_id and c.season = w.season)
    order by w.season
  loop
    total := total + close_season(x.restaurant_id, x.season);
  end loop;
  return total;
end $$;

-- ---------------------------------------------------------------------
-- PERSONAL: verificar y canjear (requiere cuenta en `staff`)
-- ---------------------------------------------------------------------
create function public.get_staff_profile(p_restaurant text) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('display_name', display_name, 'role', role)
  from staff where user_id = auth.uid() and restaurant_id = p_restaurant
$$;

create function public.staff_verify_prize(p_restaurant text, p_code text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare a prize_awards; v_code text := upper(trim(p_code));
begin
  if not is_staff(p_restaurant) then raise exception 'Acceso solo para el personal'; end if;
  insert into prize_audit (restaurant_id, staff_uid, action, code) values (p_restaurant, auth.uid(), 'verify', v_code);
  select * into a from prize_awards where restaurant_id = p_restaurant and code = v_code;
  if not found then return null; end if;
  return award_json(a, false);
end $$;

create function public.staff_redeem_prize(p_restaurant text, p_code text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare a prize_awards; v_code text := upper(trim(p_code)); v_name text;
begin
  if not is_staff(p_restaurant) then raise exception 'Acceso solo para el personal'; end if;
  select display_name into v_name from staff where user_id = auth.uid() and restaurant_id = p_restaurant;
  -- UPDATE atómico: dos canjes simultáneos del mismo código no pueden ganar ambos
  update prize_awards
     set status = 'redeemed', redeemed_at = now(), redeemed_by = auth.uid(), redeemed_by_name = v_name
   where restaurant_id = p_restaurant and code = v_code and status = 'pending' and expires_at > now()
  returning * into a;
  if not found then
    -- Se devuelve {error} en vez de lanzar excepción para que el intento quede en la auditoría
    insert into prize_audit (restaurant_id, staff_uid, action, code) values (p_restaurant, auth.uid(), 'redeem_denied', v_code);
    select * into a from prize_awards where restaurant_id = p_restaurant and code = v_code;
    if not found then return jsonb_build_object('error', 'Código no encontrado'); end if;
    if a.status = 'redeemed' then
      return jsonb_build_object('error', 'Este premio ya fue entregado (' || to_char(a.redeemed_at at time zone 'America/Lima', 'DD/MM/YYYY HH24:MI') || ')');
    end if;
    return jsonb_build_object('error', 'El código venció');
  end if;
  insert into prize_audit (restaurant_id, staff_uid, action, code) values (p_restaurant, auth.uid(), 'redeem', v_code);
  return award_json(a, false);
end $$;

create function public.staff_list_awards(p_restaurant text, p_season date default null) returns setof jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not is_staff(p_restaurant) then raise exception 'Acceso solo para el personal'; end if;
  return query select award_json(a, true) from prize_awards a
    where a.restaurant_id = p_restaurant and (p_season is null or a.season = p_season)
    order by a.season desc, a.game_id, a.place;
end $$;

-- ---------------------------------------------------------------------
-- PERMISOS: las funciones internas no se pueden llamar desde el navegador
-- ---------------------------------------------------------------------
revoke execute on function public.close_season(text, date) from public, anon, authenticated;
revoke execute on function public.close_due_seasons() from public, anon, authenticated;
revoke execute on function public.gen_prize_code(text) from public, anon, authenticated;
revoke execute on function public.validate_submission(text, int, jsonb, numeric) from public, anon, authenticated;
revoke execute on function public.check_enabled_games() from public, anon, authenticated;
revoke execute on function public.award_json(public.prize_awards, boolean) from public, anon, authenticated;
revoke execute on function public.my_player_id(text) from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- DATOS: restaurante demo (7 juegos) y sus premios
-- ---------------------------------------------------------------------
insert into public.restaurants (id, name, initials, is_demo, enabled_games) values
  ('casa-nativa', 'Casa Nativa', 'CN', true,
   array['memoria', 'chef-frenetico', 'carrera-chef', 'travieso', 'serpiente', 'duelo', 'carrera-multi']);
insert into public.prize_config (restaurant_id, place, title, description, emoji) values
  ('casa-nativa', 1, '20% de descuento', 'En el total de tu cuenta durante tu próxima visita.', '🏆'),
  ('casa-nativa', 2, 'Bebida gratis', 'Elige un pisco sour, chicha morada o café de especialidad.', '🍹'),
  ('casa-nativa', 3, '10% de descuento', 'Válido en platos de fondo de lunes a jueves.', '🎁');
