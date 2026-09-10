// Optimiza las imágenes que viven en el repo (logos, banners, fotos de
// producto de ejemplo). Las que sube el dueño desde el panel ya se
// comprimen solas en el navegador: ver src/js/comprimir-imagen.js.
//
// Reescribe cada archivo EN SU LUGAR y en su mismo formato, así ningún
// import del código tiene que cambiar. Como el original está en git,
// siempre se puede volver atrás con `git checkout -- src/assets`.
//
//   node scripts/optimizar-imagenes.mjs          → muestra qué haría
//   node scripts/optimizar-imagenes.mjs --aplicar → lo hace

import { readdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const RAIZ = path.resolve('src/assets');
const APLICAR = process.argv.includes('--aplicar');

// Cada carpeta se usa a un tamaño distinto en pantalla; no tiene
// sentido guardar un logo de 3000 px que se ve a 180.
const LIMITES = {
  logo: 600,
  favicon: 256,
  brand: 900,
  banner: 1800,
  productos: 1400,
  social: 700
};
const LIMITE_POR_DEFECTO = 1400;

const kb = (bytes) => `${Math.round(bytes / 1024)} KB`;

const listarArchivos = async (dir) => {
  const entradas = await readdir(dir, { withFileTypes: true });
  const salida = [];
  for (const entrada of entradas) {
    const completa = path.join(dir, entrada.name);
    if (entrada.isDirectory()) salida.push(...(await listarArchivos(completa)));
    else salida.push(completa);
  }
  return salida;
};

const optimizar = async (archivo) => {
  const ext = path.extname(archivo).toLowerCase();
  // El SVG es texto: sharp lo convertiría en píxeles. Y un archivo sin
  // extensión conocida no se toca.
  if (!['.png', '.jpg', '.jpeg'].includes(ext)) return null;

  const original = await readFile(archivo);
  const carpeta = path.basename(path.dirname(archivo));
  const limite = LIMITES[carpeta] ?? LIMITE_POR_DEFECTO;

  const imagen = sharp(original);
  const meta = await imagen.metadata();
  const hayQueAchicar = Math.max(meta.width ?? 0, meta.height ?? 0) > limite;

  let pipeline = sharp(original).rotate(); // rotate() aplica la orientación EXIF
  if (hayQueAchicar) {
    pipeline = pipeline.resize({ width: limite, height: limite, fit: 'inside', withoutEnlargement: true });
  }

  // Los QR se reencodean con calidad alta: un QR con artefactos de
  // compresión puede dejar de escanear, y eso rompe algo real.
  const esQr = path.basename(archivo).startsWith('qr-');

  pipeline = ext === '.png'
    // PNG se mantiene PNG para no perder la transparencia del logo.
    ? pipeline.png({ compressionLevel: 9, palette: true, quality: 90 })
    : pipeline.jpeg({ quality: esQr ? 92 : 80, mozjpeg: true });

  const nuevo = await pipeline.toBuffer();

  // Si el original ya estaba mejor optimizado, se queda como está.
  if (nuevo.length >= original.length) return { archivo, antes: original.length, despues: original.length, saltado: true };

  if (APLICAR) await writeFile(archivo, nuevo);
  return { archivo, antes: original.length, despues: nuevo.length, saltado: false };
};

const archivos = await listarArchivos(RAIZ);
let antesTotal = 0;
let despuesTotal = 0;

for (const archivo of archivos) {
  const info = await stat(archivo);
  antesTotal += info.size;

  let resultado;
  try {
    resultado = await optimizar(archivo);
  } catch (error) {
    console.log(`  ⚠  ${path.relative(RAIZ, archivo)} — no se pudo leer como imagen, se deja igual`);
    despuesTotal += info.size;
    continue;
  }

  if (!resultado) {
    despuesTotal += info.size;
    continue;
  }

  despuesTotal += resultado.despues;
  if (resultado.saltado) continue;

  const ahorro = Math.round((1 - resultado.despues / resultado.antes) * 100);
  console.log(
    `  ${path.relative(RAIZ, archivo).padEnd(46)} ${kb(resultado.antes).padStart(8)} → ${kb(resultado.despues).padStart(8)}  (−${ahorro}%)`
  );
}

console.log(`\n  TOTAL  ${kb(antesTotal)} → ${kb(despuesTotal)}`);
if (!APLICAR) console.log('\n  (simulación: volvé a correrlo con --aplicar para escribir los archivos)');
