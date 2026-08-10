-- Saviare · esquema de administración
-- Ejecutar una sola vez en Supabase: Dashboard > SQL Editor > New query > Run.
--
-- Antes de correr esto:
-- 1. Crea el proyecto en https://supabase.com
-- 2. En Authentication > Providers, deja solo Email, y en
--    Authentication > Settings desactiva "Allow new users to sign up"
--    (no queremos un formulario público de registro).
-- 3. En Authentication > Users, crea manualmente al único usuario admin
--    con el correo fchoquequ@unsa.edu.pe (o el que hayas elegido) y una
--    contraseña fuerte. Ese es el único login que existirá.

-- Cambia este correo si usas uno distinto al acordado. Se usa dentro de
-- cada política RLS de escritura: la base de datos, no el navegador,
-- decide quién puede escribir.
-- Correo admin: fchoquequ@unsa.edu.pe

create extension if not exists pgcrypto;

-- ============================================================
-- Tablas
-- ============================================================

create table categorias (
  id uuid primary key default gen_random_uuid(),
  nombre text unique not null,
  descripcion text,
  created_at timestamptz not null default now()
);

create table productos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  slug text unique not null,
  categoria_id uuid not null references categorias(id) on delete restrict,
  precio numeric(10, 2) not null check (precio >= 0),
  descripcion text,
  beneficios text[] not null default '{}',
  ingredientes text[] not null default '{}',
  modo_uso text,
  imagen_principal text,
  imagenes text[] not null default '{}',
  destacado boolean not null default false,
  activo boolean not null default true,
  stock integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table resenas (
  id uuid primary key default gen_random_uuid(),
  producto_id uuid not null references productos(id) on delete cascade,
  nombre_cliente text not null,
  calificacion smallint not null check (calificacion between 1 and 5),
  comentario text,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'aprobada', 'oculta')),
  created_at timestamptz not null default now()
);

create table pedidos (
  id uuid primary key default gen_random_uuid(),
  items jsonb not null,
  total numeric(10, 2) not null check (total >= 0),
  created_at timestamptz not null default now(),
  synced_to_argonauts boolean not null default false,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'confirmado', 'cancelado'))
);

create index resenas_producto_id_idx on resenas(producto_id);
create index productos_categoria_id_idx on productos(categoria_id);

-- Mantiene updated_at al día en cada edición de producto.
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger productos_set_updated_at
before update on productos
for each row execute function set_updated_at();

-- ============================================================
-- Row Level Security
-- ============================================================

alter table categorias enable row level security;
alter table productos enable row level security;
alter table resenas enable row level security;
alter table pedidos enable row level security;

-- Helper: ¿la petición viene autenticada como el único admin?
create or replace function is_admin()
returns boolean as $$
  select auth.jwt() ->> 'email' = 'fchoquequ@unsa.edu.pe';
$$ language sql stable;

-- --- categorias: lectura pública, escritura solo admin ---
create policy "categorias_select_public" on categorias
  for select using (true);

create policy "categorias_write_admin" on categorias
  for all using (is_admin()) with check (is_admin());

-- --- productos: público ve solo activos, admin ve y escribe todo ---
create policy "productos_select_public" on productos
  for select using (activo = true or is_admin());

create policy "productos_write_admin" on productos
  for all using (is_admin()) with check (is_admin());

-- --- resenas: cualquiera puede opinar, solo el admin modera ---
-- Lectura pública limitada a aprobadas; el admin ve todo (para moderar).
create policy "resenas_select_public" on resenas
  for select using (estado = 'aprobada' or is_admin());

-- Cualquiera puede insertar una reseña, pero siempre queda "pendiente":
-- así un cliente nunca puede auto-aprobarse ni publicar directo.
create policy "resenas_insert_public" on resenas
  for insert with check (estado = 'pendiente');

-- Solo el admin puede aprobar/ocultar (update) o borrar reseñas.
-- No existe política de update/delete para el público: por diseño,
-- un cliente no puede modificar una reseña después de enviarla.
create policy "resenas_update_admin" on resenas
  for update using (is_admin()) with check (is_admin());

create policy "resenas_delete_admin" on resenas
  for delete using (is_admin());

-- --- pedidos: cualquiera registra el suyo, solo el admin lo lee/gestiona ---
create policy "pedidos_insert_public" on pedidos
  for insert with check (true);

create policy "pedidos_select_admin" on pedidos
  for select using (is_admin());

create policy "pedidos_update_admin" on pedidos
  for update using (is_admin()) with check (is_admin());

-- ============================================================
-- Storage: bucket público de imágenes de producto
-- ============================================================

insert into storage.buckets (id, name, public)
values ('productos', 'productos', true)
on conflict (id) do nothing;

create policy "productos_storage_select_public" on storage.objects
  for select using (bucket_id = 'productos');

create policy "productos_storage_write_admin" on storage.objects
  for insert with check (bucket_id = 'productos' and is_admin());

create policy "productos_storage_update_admin" on storage.objects
  for update using (bucket_id = 'productos' and is_admin());

create policy "productos_storage_delete_admin" on storage.objects
  for delete using (bucket_id = 'productos' and is_admin());
