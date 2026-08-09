-- Registra cada pedido hecho desde el carrito (antes de abrir WhatsApp),
-- para poder sincronizarlos después hacia Argonauts.
-- Ejecutar una sola vez en Supabase: Dashboard > SQL Editor > New query > Run.

create table pedidos (
  id uuid primary key default gen_random_uuid(),
  items jsonb not null,
  total numeric(10, 2) not null check (total >= 0),
  created_at timestamptz not null default now(),
  synced_to_argonauts boolean not null default false
);

alter table pedidos enable row level security;

-- Cualquier cliente puede registrar su propio pedido al hacer clic en
-- "Pedir por WhatsApp" — igual patrón que resenas_insert_public.
create policy "pedidos_insert_public" on pedidos
  for insert with check (true);

-- Solo el admin puede leer/gestionar el historial de pedidos (lo usa el
-- script de sincronización y, más adelante, cualquier vista de reportes).
create policy "pedidos_select_admin" on pedidos
  for select using (is_admin());

create policy "pedidos_update_admin" on pedidos
  for update using (is_admin()) with check (is_admin());
