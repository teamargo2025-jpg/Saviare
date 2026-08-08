// Migración única: sube las imágenes y filas de productos.json / categorias.json a Supabase.
// Uso: node scripts/migrate-seed.mjs
// Requiere que .env tenga VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY,
// SAVIARE_ADMIN_EMAIL y SAVIARE_ADMIN_PASSWORD (el usuario admin ya creado en Supabase Auth).
// Se autentica como ese admin para que las políticas RLS permitan escribir; no usa una
// service_role key, así no hay que manejar un secreto más poderoso de lo necesario.

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

const { VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, SAVIARE_ADMIN_EMAIL, SAVIARE_ADMIN_PASSWORD } = process.env;

if (!VITE_SUPABASE_URL || !VITE_SUPABASE_ANON_KEY || !SAVIARE_ADMIN_EMAIL || !SAVIARE_ADMIN_PASSWORD) {
  console.error('Faltan variables en .env: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, SAVIARE_ADMIN_EMAIL, SAVIARE_ADMIN_PASSWORD.');
  process.exit(1);
}

const supabase = createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY);

const categorias = JSON.parse(readFileSync(path.join(rootDir, 'src/data/categorias.json'), 'utf8'));
const productos = JSON.parse(readFileSync(path.join(rootDir, 'src/data/productos.json'), 'utf8'));

const uploadedUrlByFile = new Map();

const CONTENT_TYPES = {
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg'
};

const uploadImage = async (fileName, slug) => {
  if (uploadedUrlByFile.has(fileName)) return uploadedUrlByFile.get(fileName);
  const filePath = path.join(rootDir, 'src/assets/productos', fileName);
  if (!existsSync(filePath)) {
    console.warn(`  ! No se encontró la imagen local: ${fileName}, se omite.`);
    return null;
  }
  const buffer = readFileSync(filePath);
  const storagePath = `${slug}/${fileName}`;
  const extension = path.extname(fileName).toLowerCase();
  const { error } = await supabase.storage.from('productos').upload(storagePath, buffer, {
    upsert: true,
    contentType: CONTENT_TYPES[extension] ?? 'application/octet-stream'
  });
  if (error) throw error;
  const { data } = supabase.storage.from('productos').getPublicUrl(storagePath);
  uploadedUrlByFile.set(fileName, data.publicUrl);
  return data.publicUrl;
};

const run = async () => {
  console.log(`Autenticando como ${SAVIARE_ADMIN_EMAIL}...`);
  const { error: authError } = await supabase.auth.signInWithPassword({
    email: SAVIARE_ADMIN_EMAIL,
    password: SAVIARE_ADMIN_PASSWORD
  });
  if (authError) throw authError;

  console.log('Migrando categorías...');
  const categoryIdByName = new Map();
  for (const categoria of categorias) {
    const { data, error } = await supabase
      .from('categorias')
      .upsert({ nombre: categoria.nombre, descripcion: categoria.descripcion }, { onConflict: 'nombre' })
      .select('id, nombre')
      .single();
    if (error) throw error;
    categoryIdByName.set(data.nombre, data.id);
    console.log(`  - ${data.nombre}`);
  }

  console.log('Migrando productos e imágenes...');
  for (const producto of productos) {
    const categoriaId = categoryIdByName.get(producto.categoria);
    if (!categoriaId) {
      console.warn(`  ! Producto "${producto.nombre}" tiene categoría desconocida "${producto.categoria}", se omite.`);
      continue;
    }

    const imagenPrincipal = await uploadImage(producto.imagenPrincipal, producto.slug);
    const imagenes = [];
    for (const fileName of producto.imagenes) {
      const url = await uploadImage(fileName, producto.slug);
      if (url) imagenes.push(url);
    }

    const { error } = await supabase.from('productos').upsert(
      {
        nombre: producto.nombre,
        slug: producto.slug,
        categoria_id: categoriaId,
        precio: producto.precio,
        descripcion: producto.descripcion,
        beneficios: producto.beneficios ?? [],
        ingredientes: producto.ingredientes ?? [],
        modo_uso: producto.modoUso ?? '',
        imagen_principal: imagenPrincipal,
        imagenes,
        destacado: Boolean(producto.destacado),
        activo: Boolean(producto.activo),
        disponible: true
      },
      { onConflict: 'slug' }
    );
    if (error) throw error;
    console.log(`  - ${producto.nombre}`);
  }

  console.log('Listo. Los productos y categorías ya están en Supabase.');
  await supabase.auth.signOut();
};

run().catch((error) => {
  console.error('La migración falló:', error.message ?? error);
  process.exit(1);
});
