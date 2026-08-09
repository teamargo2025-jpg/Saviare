-- Reemplaza el booleano "disponible" por un conteo real de unidades en stock.
-- Ejecutar una sola vez en Supabase: Dashboard > SQL Editor > New query > Run.

alter table productos add column stock integer not null default 0;

-- Migra el estado actual: los productos que hoy están marcados como
-- disponibles arrancan con 20 unidades (no existía un conteo real antes).
-- Ajusta las cantidades reales desde el panel admin después de correr esto.
update productos set stock = case when disponible then 20 else 0 end;

alter table productos drop column disponible;
