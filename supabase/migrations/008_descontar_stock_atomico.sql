-- Descuento de stock atomico.
--
-- Antes el navegador leia el stock, restaba y escribia el resultado.
-- Si dos ventas se confirmaban casi al mismo tiempo, la segunda pisaba
-- a la primera y se terminaba vendiendo stock inexistente (lost update).
--
-- Ahora la resta ocurre dentro de Postgres en una sola sentencia, asi
-- que el motor serializa los accesos a la misma fila y ningun descuento
-- se pierde. Correr una sola vez en el SQL Editor de Supabase.

create or replace function descontar_stock(p_items jsonb)
returns void as $$
  update productos as p
  set stock = greatest(0, p.stock - (i.cantidad)::integer)
  from jsonb_to_recordset(p_items) as i(producto_id uuid, cantidad integer)
  where p.id = i.producto_id
    and i.producto_id is not null;
$$ language sql volatile security invoker;

-- Solo el staff autenticado descuenta stock; el visitante anonimo no.
revoke execute on function descontar_stock(jsonb) from anon, public;
grant execute on function descontar_stock(jsonb) to authenticated;
