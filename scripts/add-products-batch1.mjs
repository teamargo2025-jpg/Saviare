// Alta/actualización puntual de un lote de productos nuevos (agosto 2026).
// Uso: node scripts/add-products-batch1.mjs
// Requiere las mismas variables que scripts/migrate-seed.mjs en .env
// (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, SAVIARE_ADMIN_EMAIL, SAVIARE_ADMIN_PASSWORD).

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

const CONTENT_TYPES = {
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg'
};

const CATEGORIAS = [
  { nombre: 'Suplementos', descripcion: 'Cápsulas y polvos naturales para complementar tu bienestar diario.' },
  { nombre: 'Inciensos', descripcion: 'Palo Santo y mezclas artesanales para rituales y ambientes en calma.' }
];

const PRODUCTOS = [
  {
    nombre: 'Jabón Saponificado de Cacao',
    categoria: 'Jabones',
    precio: 18,
    descripcion: 'Limpia, revitaliza y aporta elasticidad a la piel. Estimulante circulatorio. Posee propiedades antiinflamatorias y ayuda a la no retención de líquidos convirtiéndose en un aliado para aliviar la celulitis.',
    imagen: 'Jabon-Saponificado-de-Cacao.jpg.webp',
    slug: 'jabon-cacao'
  },
  {
    nombre: 'Jabón Saponificado de Eucalipto',
    categoria: 'Jabones',
    precio: 18,
    descripcion: 'Descongestiona y refresca la piel con el aroma intenso del eucalipto. Sus propiedades antisépticas y estimulantes ayudan a activar la circulación y despejar los sentidos, ideal para un baño revitalizante que renueva la piel de pies a cabeza.',
    imagen: 'jabon-eucalipto.webp',
    slug: 'jabon-eucalipto'
  },
  {
    nombre: 'Jabón Saponificado de Manzanilla',
    categoria: 'Jabones',
    precio: 18,
    descripcion: 'Calma, suaviza y equilibra pieles sensibles gracias a las propiedades antiinflamatorias y relajantes de la manzanilla. Ayuda a reducir enrojecimientos e irritaciones, dejando la piel serena y con una sensación de frescura duradera.',
    imagen: 'jabon-manzanilla.webp',
    slug: 'jabon-manzanilla'
  },
  {
    nombre: 'Jabón Saponificado de Avena',
    categoria: 'Jabones',
    precio: 18,
    descripcion: 'Nutre e hidrata en profundidad gracias a las propiedades emolientes de la avena. Actúa como exfoliante suave que elimina células muertas sin resecar, dejando la piel más tersa, suave y protegida frente a la irritación diaria.',
    imagen: 'jabon-avena.webp',
    slug: 'jabon-avena'
  },
  {
    nombre: 'Jabón Saponificado de Algas Marinas',
    categoria: 'Jabones',
    precio: 18,
    descripcion: 'Remineraliza y desintoxica la piel gracias a los oligoelementos naturales de las algas marinas. Su efecto exfoliante y tonificante ayuda a mejorar la firmeza y textura de la piel, dejando una sensación de limpieza profunda y frescura marina.',
    imagen: 'jabon-algas-marinas.webp',
    slug: 'jabon-algas-marinas'
  },
  {
    nombre: 'Limpiador Facial Centellante',
    categoria: 'Cuidado personal',
    precio: 30,
    descripcion: 'Limpiador facial a base de hidrolato y extracto de Centella Asiática de uso diario. Es antioxidante, fuente de aminoácidos y tiene efecto calmante.',
    imagen: 'limpiador-facial-centellante.webp',
    slug: 'limpiador-facial-centellante'
  },
  {
    nombre: 'Gel de Limpieza Íntima 120ml',
    categoria: 'Cuidado personal',
    precio: 35,
    descripcion: 'Gel para la limpieza de la vulva sin alterar el pH natural de la zona. Elaborado con agua de Rosas y Manzanilla que aportan sensación calmante.',
    imagen: 'gel_intimo.png',
    slug: 'gel-limpieza-intima'
  },
  {
    nombre: 'Cápsulas de Camu Camu',
    categoria: 'Suplementos',
    precio: 60,
    descripcion: 'Vitamina C Natural para el Sistema Inmune | 100 Cápsulas Veganas (1500 mg/Porción) | Sin OGM, Sin Gluten.',
    imagen: 'camu-camu-uso.jpg',
    slug: 'capsulas-camu-camu'
  },
  {
    nombre: 'Triple Maca (Negro + Rojo + Amarillo)',
    categoria: 'Suplementos',
    precio: 35,
    descripcion: 'Cada cápsula proporciona 1,500 mg de polvo de raíz de maca gelatinizada orgánica certificada.',
    imagen: 'triple_maca.webp',
    slug: 'triple-maca'
  },
  {
    nombre: 'Maca Negra Orgánica',
    categoria: 'Suplementos',
    precio: 60,
    descripcion: 'Aumenta el rendimiento físico y mental, y apoya la salud reproductiva masculina.',
    imagen: 'MACA-NEGRA.jpg',
    slug: 'maca-negra-organica'
  },
  {
    nombre: 'Polvo de Maca Roja',
    categoria: 'Suplementos',
    precio: 40,
    descripcion: 'Ayuda a aliviar síntomas de la menopausia, favorece el equilibrio hormonal y tiene efecto anti-envejecimiento.',
    imagen: 'polvo-maca-roja-.jpg',
    slug: 'polvo-maca-roja'
  },
  {
    nombre: 'Incienso Premium Wiracoa y Palo Santo',
    categoria: 'Inciensos',
    precio: 30,
    descripcion: 'Sumérjase en la esencia de los Andes con nuestros inciensos PREMIUM de Wiracoa & Palo Santo. Hechos a mano a partir de una mezcla única de aserrín, resina de Palo Santo y Wiracoa, estos inciensos traen el poder de enraizamiento del elemento Tierra (Pacha).',
    imagen: 'palo_santo_wiracoa.jpg',
    slug: 'incienso-wiracoa-palo-santo'
  },
  {
    nombre: 'Incienso y Palo Santo Mamá Toya',
    categoria: 'Inciensos',
    precio: 17,
    descripcion: 'Incienso artesanal elaborado con Palo Santo, ideal para rituales de limpieza energética y momentos de calma en tu espacio.',
    imagen: 'incienso_mama_toya.webp',
    slug: 'incienso-mama-toya'
  },
  {
    nombre: 'Incienso | Madera Sagrada',
    categoria: 'Inciensos',
    precio: 20,
    descripcion: 'Varas de Palo Santo puro, conocidas como madera sagrada, para purificar ambientes y crear una atmósfera de bienestar.',
    imagen: 'palo-santo.jpg',
    slug: 'incienso-madera-sagrada'
  },
  {
    nombre: 'Cepillo de Bambú',
    categoria: 'Biodegradables',
    precio: 9,
    descripcion: 'Cepillo dental de bambú biodegradable, una alternativa sostenible al plástico para tu rutina de higiene diaria.',
    imagen: 'cepillo_bambu.png',
    slug: 'cepillo-bambu'
  },
  {
    nombre: 'Biodentrífico',
    categoria: 'Biodegradables',
    precio: 25,
    descripcion: 'Pasta dental biodegradable elaborada con ingredientes naturales, libre de químicos agresivos.',
    imagen: 'biodentrifico.png',
    slug: 'biodentrifico'
  }
];

const uploadedUrlByFile = new Map();

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

  console.log('Creando categorías nuevas...');
  const categoryIdByName = new Map();
  const { data: existingCategories, error: catError } = await supabase.from('categorias').select('id, nombre');
  if (catError) throw catError;
  existingCategories.forEach((c) => categoryIdByName.set(c.nombre, c.id));

  for (const categoria of CATEGORIAS) {
    if (categoryIdByName.has(categoria.nombre)) {
      console.log(`  - ${categoria.nombre} (ya existía)`);
      continue;
    }
    const { data, error } = await supabase
      .from('categorias')
      .insert({ nombre: categoria.nombre, descripcion: categoria.descripcion })
      .select('id, nombre')
      .single();
    if (error) throw error;
    categoryIdByName.set(data.nombre, data.id);
    console.log(`  - ${data.nombre} (nueva)`);
  }

  console.log('Creando/actualizando productos...');
  for (const producto of PRODUCTOS) {
    const categoriaId = categoryIdByName.get(producto.categoria);
    if (!categoriaId) {
      console.warn(`  ! Categoría desconocida "${producto.categoria}" para "${producto.nombre}", se omite.`);
      continue;
    }

    const imagenUrl = await uploadImage(producto.imagen, producto.slug);

    const { error } = await supabase.from('productos').upsert(
      {
        nombre: producto.nombre,
        slug: producto.slug,
        categoria_id: categoriaId,
        precio: producto.precio,
        descripcion: producto.descripcion,
        beneficios: [],
        ingredientes: [],
        modo_uso: '',
        imagen_principal: imagenUrl,
        imagenes: imagenUrl ? [imagenUrl] : [],
        destacado: false,
        activo: true,
        disponible: true
      },
      { onConflict: 'slug' }
    );
    if (error) throw error;
    console.log(`  - ${producto.nombre}${imagenUrl ? '' : ' (sin imagen)'}`);
  }

  console.log('Listo.');
  await supabase.auth.signOut();
};

run().catch((error) => {
  console.error('Falló el script:', error.message ?? error);
  process.exit(1);
});
