// Sincroniza Saviare -> Argonauts: inventario completo + pedidos nuevos.
// Uso: node scripts/sync-to-argonauts.mjs
// Requiere en .env: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY,
// SAVIARE_ADMIN_EMAIL, SAVIARE_ADMIN_PASSWORD, ARGONAUTS_API_URL, ARGONAUTS_API_KEY.
// No usa login personal de Argonauts: habla con su API estandarizada de
// integraciones vía API key, generada desde la pestaña "Integraciones" de
// la empresa en Argonauts. El día que Argonauts tenga dominio propio, solo
// cambia ARGONAUTS_API_URL — el resto del script sigue igual.

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const rootDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

const loadEnvFile = (filePath) => {
  if (!existsSync(filePath)) return;
  for (const line of readFileSync(filePath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
};

loadEnvFile(path.join(rootDir, '.env'));

const {
  VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY,
  SAVIARE_ADMIN_EMAIL,
  SAVIARE_ADMIN_PASSWORD,
  ARGONAUTS_API_URL,
  ARGONAUTS_API_KEY
} = process.env;

if (
  !VITE_SUPABASE_URL ||
  !VITE_SUPABASE_ANON_KEY ||
  !SAVIARE_ADMIN_EMAIL ||
  !SAVIARE_ADMIN_PASSWORD ||
  !ARGONAUTS_API_URL ||
  !ARGONAUTS_API_KEY
) {
  console.error(
    'Faltan variables en .env: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, ' +
      'SAVIARE_ADMIN_EMAIL, SAVIARE_ADMIN_PASSWORD, ARGONAUTS_API_URL, ARGONAUTS_API_KEY.'
  );
  process.exit(1);
}

const supabase = createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY);

const argonauts = async (endpoint, body) => {
  const response = await fetch(`${ARGONAUTS_API_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': ARGONAUTS_API_KEY
    },
    body: JSON.stringify(body)
  });

  const json = await response.json().catch(() => null);

  if (!response.ok || !json?.success) {
    throw new Error(json?.message || `Argonauts respondió ${response.status} en ${endpoint}`);
  }

  return json.data;
};

const run = async () => {
  console.log(`Autenticando en Supabase como ${SAVIARE_ADMIN_EMAIL}...`);
  const { error: authError } = await supabase.auth.signInWithPassword({
    email: SAVIARE_ADMIN_EMAIL,
    password: SAVIARE_ADMIN_PASSWORD
  });
  if (authError) throw authError;

  console.log('Sincronizando inventario (snapshot completo de productos activos)...');
  const { data: productos, error: productosError } = await supabase
    .from('productos')
    .select('slug, nombre, stock, precio')
    .eq('activo', true);
  if (productosError) throw productosError;

  await argonauts('/inventory/sync', {
    items: productos.map((producto) => ({
      externalRef: producto.slug,
      name: producto.nombre,
      stock: producto.stock,
      unitCost: producto.precio
    }))
  });
  console.log(`  - ${productos.length} producto(s) sincronizados.`);

  console.log('Buscando pedidos confirmados sin sincronizar...');
  const { data: pedidos, error: pedidosError } = await supabase
    .from('pedidos')
    .select('*')
    .eq('synced_to_argonauts', false)
    .eq('estado', 'confirmado')
    .order('created_at', { ascending: true });
  if (pedidosError) throw pedidosError;

  if (!pedidos.length) {
    console.log('  - No hay pedidos confirmados nuevos que sincronizar.');
  }

  for (const pedido of pedidos) {
    const items = pedido.items ?? [];
    const resumen = items.map((item) => `${item.cantidad}x ${item.nombre}`).join(', ');

    await argonauts('/sales', {
      date: pedido.created_at,
      totalAmount: Number(pedido.total),
      transactionCount: 1,
      salesChannel: 'Saviare (WhatsApp)',
      notes: resumen,
      items: items.map((item) => ({
        externalRef: item.slug,
        name: item.nombre,
        quantity: item.cantidad,
        unitPrice: item.precio
      }))
    });

    const { error: updateError } = await supabase
      .from('pedidos')
      .update({ synced_to_argonauts: true })
      .eq('id', pedido.id);
    if (updateError) throw updateError;

    console.log(`  - Pedido ${pedido.id} sincronizado (${resumen || 'sin items'}).`);
  }

  console.log('Listo.');
  await supabase.auth.signOut();
};

run().catch((error) => {
  console.error('La sincronización falló:', error.message ?? error);
  process.exit(1);
});
