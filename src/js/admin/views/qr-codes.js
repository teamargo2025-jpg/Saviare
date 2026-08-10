import QRCode from 'qrcode';
import { listAllProducts } from '../api.js';

const currency = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' });

const ICON_RULES = [
  [/cepillo/, '🪥'],
  [/biodentrifico/, '🦷'],
  [/jabon/, '🧼'],
  [/incienso/, '🕯️'],
  [/capsula/, '💊'],
  [/maca/, '🌰'],
  [/gel|limpiador/, '🧴']
];

const iconFor = (slug) => {
  const match = ICON_RULES.find(([pattern]) => pattern.test(slug));
  return match ? match[1] : '🌿';
};

// Alto nivel de corrección de errores ('H', ~30%) porque le tapamos el
// centro con un ícono — el QR sigue leyéndose igual aunque esa zona
// no sea "código" de verdad.
const generateQrWithIcon = async (text, icon) => {
  const canvas = document.createElement('canvas');
  await QRCode.toCanvas(canvas, text, { width: 220, margin: 1, errorCorrectionLevel: 'H' });

  const ctx = canvas.getContext('2d');
  const size = canvas.width;
  const cx = size / 2;
  const cy = size / 2;
  const badgeRadius = size * 0.15;

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(cx, cy, badgeRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#1f3d2e';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.font = `${badgeRadius * 1.2}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(icon, cx, cy + 1);

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
      <p class="qr-hint">Cada código guarda el identificador del producto (su "slug"). Imprime, recorta y pega la etiqueta en el producto o el estante.</p>
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
        const dataUrl = await generateQrWithIcon(product.slug, iconFor(product.slug));
        const img = grid.querySelector(`[data-qr-img="${product.slug}"]`);
        if (img) img.src = dataUrl;
      })
    );
  } catch (error) {
    setStatus('No se pudieron generar algunos códigos QR.', true);
  }

  container.querySelector('[data-print-qr]').addEventListener('click', () => window.print());
};
