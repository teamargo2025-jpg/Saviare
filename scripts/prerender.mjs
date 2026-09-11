// Prerenderiza el HTML que Google necesita ver.
// Uso: node scripts/prerender.mjs   (se ejecuta solo, despues de `vite build`)
//
// El sitio se pinta entero desde JavaScript: index.html, catalogo.html y
// producto.html salen del build con un <div id="app"></div> vacio, y los
// productos se piden a Supabase ya en el navegador. Google ejecuta JavaScript,
// pero en una segunda pasada mas lenta y menos fiable, y aqui ademas tendria
// que esperar una llamada a la API. Para un sitio nuevo sin autoridad eso
// suele acabar en "indexado como pagina en blanco".
//
// Este script rellena ese hueco: escribe en el HTML el texto real que el
// buscador debe leer, y genera una pagina por producto (producto-<slug>.html)
// para que exista una URL por cada cosa que se vende. El JavaScript sigue
// arrancando igual y reemplaza el contenido al cargar, asi que el precio y el
// stock que ve una persona siempre son los de ahora, no los del ultimo build.
//
// Las URLs son planas (producto-<slug>.html) y no una subcarpeta a proposito:
// los assets del build son absolutos y aguantarian cualquier profundidad, pero
// los enlaces que genera el JS son relativos ("catalogo.html"), y un nivel mas
// abajo apuntarian a la nada.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const rootDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const distDir = path.join(rootDir, 'dist');
const SITIO = 'https://teamargo2025-jpg.github.io/Saviare/';
const IMAGEN_SOCIAL = SITIO + 'og-saviare.png';

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

const { VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY } = process.env;

if (!VITE_SUPABASE_URL || !VITE_SUPABASE_ANON_KEY) {
  // Fallar aqui es mejor que publicar en silencio un sitio sin contenido
  // indexable: el build "funcionaria" y nadie se enteraria hasta mirar Google.
  console.error('Falta VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY en .env; no se puede prerenderizar.');
  process.exit(1);
}

const supabase = createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY);

// El contenido viene de la base y acaba dentro del HTML: escapar no es opcional.
const esc = (valor) =>
  String(valor ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

// Para atributos como description: sin saltos de linea y recortado al limite
// que Google muestra en el resultado.
const resumen = (texto, limite = 155) => {
  const plano = String(texto ?? '').replace(/\s+/g, ' ').trim();
  if (plano.length <= limite) return plano;
  const cortado = plano.slice(0, limite - 1);
  const ultimoEspacio = cortado.lastIndexOf(' ');
  return (ultimoEspacio > limite * 0.6 ? cortado.slice(0, ultimoEspacio) : cortado) + '…';
};

const lista = (titulo, items) =>
  Array.isArray(items) && items.length
    ? `<h2>${esc(titulo)}</h2><ul>${items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`
    : '';

// JSON-LD se inserta tal cual dentro de <script>: lo unico que puede romperlo
// (o inyectar) es un "</script>" dentro de un valor.
const jsonLd = (objeto) => JSON.stringify(objeto).replaceAll('</', '<\\/');

const reemplazarEtiqueta = (html, patron, reemplazo) => {
  if (!patron.test(html)) throw new Error(`No se encontro la etiqueta a sustituir: ${patron}`);
  return html.replace(patron, reemplazo);
};

const ponerMetadatos = (html, { titulo, descripcion, url, imagen, tipo }) => {
  let salida = html;
  salida = reemplazarEtiqueta(salida, /<title>[^<]*<\/title>/, `<title>${esc(titulo)}</title>`);
  salida = reemplazarEtiqueta(
    salida,
    /<meta name="description" content="[^"]*" \/>/,
    `<meta name="description" content="${esc(descripcion)}" />`,
  );
  salida = reemplazarEtiqueta(
    salida,
    /<link rel="canonical" href="[^"]*" \/>/,
    `<link rel="canonical" href="${esc(url)}" />`,
  );
  salida = salida.replace(/<meta property="og:title" content="[^"]*" \/>/, `<meta property="og:title" content="${esc(titulo)}" />`);
  salida = salida.replace(/<meta property="og:description" content="[^"]*" \/>/, `<meta property="og:description" content="${esc(descripcion)}" />`);
  salida = salida.replace(/<meta property="og:url" content="[^"]*" \/>/, `<meta property="og:url" content="${esc(url)}" />`);
  salida = salida.replace(/<meta property="og:image" content="[^"]*" \/>/, `<meta property="og:image" content="${esc(imagen)}" />`);
  if (tipo) salida = salida.replace(/<meta property="og:type" content="[^"]*" \/>/, `<meta property="og:type" content="${esc(tipo)}" />`);
  return salida;
};

// Ese contenido tambien se ve durante el instante que va desde que carga el
// HTML hasta que el JS termina de pedir los datos. Sin nada de estilo se ve
// roto, asi que lleva lo justo para parecer la pagina de verdad. No es una
// copia de la hoja de estilos: es el andamio de ese primer segundo.
const ESTILO_PREVIO = `    <style>
      #app > article, #app > h1, #app > h2, #app > p, #app > ul {
        max-width: 46rem; margin-left: auto; margin-right: auto; padding: 0 1.25rem;
      }
      #app h1 { font-size: clamp(1.75rem, 4vw, 2.5rem); line-height: 1.15; margin: 1.5rem auto .5rem; }
      #app h2 { font-size: 1.25rem; margin: 1.75rem auto .5rem; }
      #app img { display: block; max-width: min(100%, 22rem); height: auto; margin: 1.5rem auto; border-radius: .75rem; }
      #app ul { line-height: 1.7; }
      #app p { line-height: 1.65; }
    </style>`;

// El JS vacia #app y lo repinta al cargar. Lo que se escriba aqui es para el
// rastreador y para el primer instante de pintado, no un segundo renderizador
// que haya que mantener en paralelo.
const ponerContenido = (html, contenido, extraHead = '') => {
  if (!html.includes('<div id="app"></div>')) {
    throw new Error('El HTML del build no tiene <div id="app"></div>; cambio la plantilla.');
  }
  let salida = html.replace(
    '<div id="app"></div>',
    `<div id="app">\n<!-- Contenido prerenderizado para buscadores. El JS lo reemplaza al cargar con datos frescos. -->\n${contenido}\n</div>`,
  );
  return salida.replace('</head>', `${ESTILO_PREVIO}\n${extraHead ? extraHead + '\n' : ''}  </head>`);
};

const paginaProducto = (plantilla, producto) => {
  const url = `${SITIO}producto-${producto.slug}.html`;
  const titulo = `${producto.nombre} | Saviare`;
  const descripcion = resumen(producto.descripcion);
  // La vista previa usa la foto del producto, que es lo que uno espera ver al
  // recibir el enlace por WhatsApp. Ocho de los productos la tienen en .webp y
  // no todos los lectores de enlaces lo procesan igual de bien; si alguna vez
  // se comparte un producto y sale sin imagen, la salida es cambiar este
  // fallback por IMAGEN_SOCIAL para los .webp, o volver a subir esas fotos
  // como .jpg. Se comprueba pegando el enlace en un chat propio.
  const imagen = producto.imagen_principal || IMAGEN_SOCIAL;
  const disponible = (producto.stock ?? 0) > 0;

  const datosEstructurados = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: producto.nombre,
    description: descripcion,
    image: imagen,
    brand: { '@type': 'Brand', name: 'Saviare' },
    category: producto.categorias?.nombre || undefined,
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: 'PEN',
      price: producto.precio,
      availability: disponible
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
    },
  };

  const contenido = `
<article>
  <p><a href="catalogo.html">Volver al catálogo</a></p>
  <img src="${esc(imagen)}" alt="${esc(producto.nombre)}" width="480" />
  <h1>${esc(producto.nombre)}</h1>
  ${producto.categorias?.nombre ? `<p>Categoría: ${esc(producto.categorias.nombre)}</p>` : ''}
  <p><strong>S/ ${esc(producto.precio)}</strong> — ${disponible ? 'Disponible' : 'Agotado'}</p>
  <p>${esc(producto.descripcion)}</p>
  ${lista('Beneficios', producto.beneficios)}
  ${lista('Ingredientes', producto.ingredientes)}
  ${producto.modo_uso ? `<h2>Modo de uso</h2><p>${esc(producto.modo_uso)}</p>` : ''}
</article>`.trim();

  const html = ponerMetadatos(plantilla, { titulo, descripcion, url, imagen, tipo: 'product' });
  return ponerContenido(
    html,
    contenido,
    `    <script type="application/ld+json">${jsonLd(datosEstructurados)}</script>`,
  );
};

const enlacesProductos = (productos) =>
  `<ul>${productos
    .map((p) => `<li><a href="producto-${esc(p.slug)}.html">${esc(p.nombre)}</a></li>`)
    .join('')}</ul>`;

const sitemap = (productos, hoy) => {
  const entradas = [
    { loc: SITIO, freq: 'weekly', prio: '1.0' },
    { loc: SITIO + 'catalogo.html', freq: 'weekly', prio: '0.9' },
    ...productos.map((p) => ({ loc: `${SITIO}producto-${p.slug}.html`, freq: 'weekly', prio: '0.8' })),
    { loc: SITIO + 'contacto.html', freq: 'monthly', prio: '0.7' },
    { loc: SITIO + 'nosotros.html', freq: 'monthly', prio: '0.7' },
    { loc: SITIO + 'privacidad.html', freq: 'yearly', prio: '0.3' },
    { loc: SITIO + 'terminos.html', freq: 'yearly', prio: '0.3' },
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>
<!-- Generado por scripts/prerender.mjs en cada build. No editar a mano. -->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entradas
  .map(
    (e) => `  <url>
    <loc>${e.loc}</loc>
    <lastmod>${hoy}</lastmod>
    <changefreq>${e.freq}</changefreq>
    <priority>${e.prio}</priority>
  </url>`,
  )
  .join('\n')}
</urlset>
`;
};

const main = async () => {
  const { data, error } = await supabase
    .from('productos')
    .select('*, categorias ( nombre )')
    .eq('activo', true)
    .order('nombre');

  if (error) throw error;
  const productos = (data ?? []).filter((p) => p.slug);

  if (!productos.length) {
    console.error('Supabase no devolvio productos activos con slug; no se prerenderiza nada.');
    process.exit(1);
  }

  const plantillaProducto = readFileSync(path.join(distDir, 'producto.html'), 'utf8');

  for (const producto of productos) {
    const destino = path.join(distDir, `producto-${producto.slug}.html`);
    writeFileSync(destino, paginaProducto(plantillaProducto, producto));
  }

  // Portada y catalogo: texto real y, sobre todo, enlaces a cada producto para
  // que el rastreador los descubra sin tener que ejecutar nada.
  const portada = readFileSync(path.join(distDir, 'index.html'), 'utf8');
  writeFileSync(
    path.join(distDir, 'index.html'),
    ponerContenido(
      portada,
      `<h1>Productos biodegradables y orgánicos en Perú</h1>
<p>Saviare reúne jabones artesanales saponificados, inciensos de palo santo, maca orgánica y cuidado personal biodegradable. Cada producto se consulta y se pide por WhatsApp.</p>
<h2>Nuestros productos</h2>
${enlacesProductos(productos)}
<p><a href="catalogo.html">Ver el catálogo completo</a> · <a href="nosotros.html">Sobre Saviare</a> · <a href="contacto.html">Contacto</a></p>`,
    ),
  );

  const catalogo = readFileSync(path.join(distDir, 'catalogo.html'), 'utf8');
  writeFileSync(
    path.join(distDir, 'catalogo.html'),
    ponerContenido(
      catalogo,
      `<h1>Catálogo de productos naturales y biodegradables</h1>
<p>Jabones saponificados, inciensos, maca, camu camu y cuidado personal biodegradable. Cada producto se consulta por WhatsApp.</p>
${enlacesProductos(productos)}`,
    ),
  );

  const hoy = new Date().toISOString().slice(0, 10);
  writeFileSync(path.join(distDir, 'sitemap.xml'), sitemap(productos, hoy));

  console.log(`Prerenderizadas ${productos.length} páginas de producto:`);
  for (const p of productos) console.log(`  producto-${p.slug}.html  —  ${p.nombre}`);
  console.log('Portada y catálogo con contenido indexable; sitemap regenerado.');
};

main().catch((e) => {
  console.error('Fallo el prerenderizado:', e.message);
  process.exit(1);
});
