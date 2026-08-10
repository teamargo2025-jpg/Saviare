import QRCode from 'qrcode';
import { listAllProducts } from '../api.js';
import { icon } from '../../components.js';

const currency = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' });

const BRAND_COLOR = '#1f3d2e';

const ICON_RULES = [
  [/cepillo/, 'toothbrush'],
  [/biodentrifico/, 'toothbrush'],
  [/jabon/, 'soap'],
  [/incienso/, 'incense'],
  [/capsula/, 'capsule'],
  [/maca/, 'root'],
  [/gel|limpiador/, 'droplet']
];

const iconNameFor = (slug) => {
  const match = ICON_RULES.find(([pattern]) => pattern.test(slug));
  return match ? match[1] : 'leaf';
};

const loadIconImage = (name) => new Promise((resolve, reject) => {
  const svgMarkup = icon(name)
    .replace(/currentColor/g, BRAND_COLOR)
    .replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" ');
  const img = new Image();
  img.onload = () => resolve(img);
  img.onerror = reject;
  img.src = `data:image/svg+xml;base64,${btoa(svgMarkup)}`;
});

// Alto nivel de corrección de errores ('H', ~30%) porque le tapamos el
// centro con un ícono — el QR sigue leyéndose igual aunque esa zona
// no sea "código" de verdad.
const generateQrWithIcon = async (text, iconName) => {
  const canvas = document.createElement('canvas');
  await QRCode.toCanvas(canvas, text, { width: 220, margin: 1, errorCorrectionLevel: 'H' });

  const ctx = canvas.getContext('2d');
  const size = canvas.width;
  const cx = size / 2;
  const cy = size / 2;
  const badgeRadius = size * 0.16;

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(cx, cy, badgeRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = BRAND_COLOR;
  ctx.lineWidth = 2;
  ctx.stroke();

  const iconImage = await loadIconImage(iconName);
  const iconSize = badgeRadius * 1.3;
  ctx.drawImage(iconImage, cx - iconSize / 2, cy - iconSize / 2, iconSize, iconSize);

  return canvas.toDataURL('image/png');
};

export const renderQrCodesView = async (container, setStatus) => {
  container.innerHTML = '<p class="empty-state">Cargando productos…</p>';

  const products = (await listAllProducts()).filter((product) => product.activo);

  if (!products.length) {
    container.innerHTML = '<p class="empty-state">No hay productos activos para generar códigos QR.</p>';
    return;
  }

  container.innerHTML = `
    <div class="admin-toolbar admin-toolbar-noprint">
      <button class="btn btn-primary" type="button" data-print-qr>Imprimir códigos QR</button>
      <p class="qr-hint">Cada código guarda el identificador del producto (su "slug"). Imprime en papel sticker, recorta y pega la etiqueta en el producto o el estante.</p>
    </div>
    <div class="qr-grid" data-qr-grid></div>
  `;

  const grid = container.querySelector('[data-qr-grid]');

  grid.innerHTML = products.map((product) => `
    <div class="qr-card">
      <img class="qr-image" data-qr-img="${product.slug}" alt="Código QR de ${product.nombre}" />
      <p class="qr-card-name">${product.nombre}</p>
      <p class="qr-card-price">${currency.format(product.precio)}</p>
      <p class="qr-card-slug">${product.slug}</p>
    </div>
  `).join('');

  try {
    await Promise.all(
      products.map(async (product) => {
        const dataUrl = await generateQrWithIcon(product.slug, iconNameFor(product.slug));
        const img = grid.querySelector(`[data-qr-img="${product.slug}"]`);
        if (img) img.src = dataUrl;
      })
    );
  } catch (error) {
    setStatus('No se pudieron generar algunos códigos QR.', true);
  }

  container.querySelector('[data-print-qr]').addEventListener('click', () => window.print());
};
