// Comprime las fotos EN EL NAVEGADOR, antes de subirlas.
//
// Una foto de celular sin tocar pesa entre 3 y 6 MB. Eso llena el
// Storage gratuito de Supabase en pocas decenas de productos, y cada
// visita al catálogo se descarga esos megas de nuevo: en un celular
// con datos móviles la página tarda una eternidad o directamente no
// carga.
//
// Reducirla a ~1600 px de lado y reencodearla deja archivos de 150-400
// KB, que a simple vista se ven igual en pantalla.

// Un lado de 1600 px alcanza para pantalla completa en cualquier
// celular y para la mayoría de laptops. Más que eso es peso que nadie
// llega a ver.
export const MAX_LADO = 1600;
export const CALIDAD = 0.82;

// Tope de entrada. No es por el Storage (comprimimos igual) sino por
// la memoria del celular: decodificar una imagen enorme puede colgar
// la pestaña, y es mejor decirlo que quedarse en blanco.
export const MAX_ENTRADA_MB = 25;

// SVG es texto (comprimirlo lo convertiría en un mapa de píxeles
// borroso) y un GIF animado perdería la animación. Se suben tal cual.
const FORMATOS_QUE_NO_SE_TOCAN = ['image/svg+xml', 'image/gif'];

export const calcularDimensiones = (ancho, alto, maxLado = MAX_LADO) => {
  const ladoMayor = Math.max(ancho, alto);
  if (ladoMayor <= maxLado) return { ancho, alto };

  const escala = maxLado / ladoMayor;
  return {
    // Al menos 1 px: una imagen de 4000x1 no puede terminar con alto 0.
    ancho: Math.max(1, Math.round(ancho * escala)),
    alto: Math.max(1, Math.round(alto * escala))
  };
};

export const nombreComprimido = (nombre, extension = 'webp') => {
  const sinExtension = nombre.replace(/\.[^./\\]+$/, '') || 'imagen';
  return `${sinExtension}.${extension}`;
};

// Los celulares guardan la foto siempre en horizontal y anotan aparte
// "esto va rotado 90°". Si se ignora ese dato, las fotos verticales
// quedan acostadas. createImageBitmap sabe leerlo; la etiqueta <img>
// es el plan B para navegadores viejos.
const decodificar = async (file) => {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch (error) {
      // Sigue al plan B.
    }
  }

  const url = URL.createObjectURL(file);
  try {
    return await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('imagen_ilegible'));
      img.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
};

const aBlob = (canvas, tipo, calidad) =>
  new Promise((resolve) => canvas.toBlob(resolve, tipo, calidad));

/**
 * Devuelve una versión liviana del archivo. Si comprimir no ayuda
 * (imagen ya optimizada, formato que no se toca, navegador sin
 * canvas), devuelve el archivo original: nunca falla por esto — que
 * el dueño no pueda cargar una foto es peor que subirla pesada.
 */
export const comprimirImagen = async (file, { maxLado = MAX_LADO, calidad = CALIDAD } = {}) => {
  if (!file || !file.type?.startsWith('image/')) return file;
  if (FORMATOS_QUE_NO_SE_TOCAN.includes(file.type)) return file;

  if (file.size > MAX_ENTRADA_MB * 1024 * 1024) {
    throw new Error('imagen_demasiado_grande');
  }

  try {
    const bitmap = await decodificar(file);
    const anchoOriginal = bitmap.width ?? bitmap.naturalWidth;
    const altoOriginal = bitmap.height ?? bitmap.naturalHeight;
    const { ancho, alto } = calcularDimensiones(anchoOriginal, altoOriginal, maxLado);

    const canvas = document.createElement('canvas');
    canvas.width = ancho;
    canvas.height = alto;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;

    // Fondo blanco: un PNG con transparencia pasado a WebP/JPEG
    // dejaría los huecos en negro.
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, ancho, alto);
    ctx.drawImage(bitmap, 0, 0, ancho, alto);
    bitmap.close?.();

    const blob = await aBlob(canvas, 'image/webp', calidad);
    if (!blob) return file;

    // Si el original ya venía optimizado, comprimirlo otra vez solo
    // suma pérdida de calidad sin ganar peso. Se queda el original.
    if (blob.size >= file.size) return file;

    return new File([blob], nombreComprimido(file.name), {
      type: 'image/webp',
      lastModified: Date.now()
    });
  } catch (error) {
    if (error.message === 'imagen_demasiado_grande') throw error;
    return file;
  }
};

export const pesoLegible = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
