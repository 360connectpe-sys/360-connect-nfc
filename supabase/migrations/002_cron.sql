-- =====================================================================
-- Cierre automático de temporadas (requiere la extensión pg_cron:
-- Supabase → Database → Extensions → pg_cron → Enable)
--
-- Las temporadas terminan el domingo 23:59:59 (hora de Lima = UTC-5).
-- El job corre el lunes 00:01 de Lima (05:01 UTC), genera los ganadores
-- oficiales y sus códigos de premio. Es idempotente.
-- =====================================================================
create extension if not exists pg_cron;

select cron.schedule('360c-cerrar-temporadas', '1 5 * * 1', $$ select public.close_due_seasons(); $$);
