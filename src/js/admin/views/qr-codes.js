import QRCode from 'qrcode';
import { listAllProducts } from '../api.js';

const currency = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' });

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
        const dataUrl = await QRCode.toDataURL(product.slug, { width: 220, margin: 1 });
        const img = grid.querySelector(`[data-qr-img="${product.slug}"]`);
        if (img) img.src = dataUrl;
      })
    );
  } catch (error) {
    setStatus('No se pudieron generar algunos códigos QR.', true);
  }

  container.querySelector('[data-print-qr]').addEventListener('click', () => window.print());
};
