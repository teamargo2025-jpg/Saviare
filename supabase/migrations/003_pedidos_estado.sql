-- Agrega estado a los pedidos: el stock real y la sincronización con
-- Argonauts solo se disparan cuando el admin confirma un pedido, no en
-- cuanto el cliente hace clic en "Pedir por WhatsApp" (que es solo una
-- consulta, no una venta garantizada).
-- Ejecutar una sola vez en Supabase: Dashboard > SQL Editor > New query > Run.

alter table pedidos
  add column estado text not null default 'pendiente'
  check (estado in ('pendiente', 'confirmado', 'cancelado'));
