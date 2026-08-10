import jsQR from 'jsqr';
import { listAllProducts, recordDirectSale } from '../api.js';

const currency = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' });
const RESCAN_DELAY_MS = 1500;

export const renderScanSellView = async (container, setStatus) => {
  container.innerHTML = '<p class="empty-state">Cargando catálogo…</p>';

  const products = await listAllProducts();
  const productBySlug = new Map(products.map((product) => [product.slug, product]));

  const cart = new Map();

  container.innerHTML = `
    <div class="scan-sell-layout">
      <div class="scan-sell-camera">
        <video data-scan-video playsinline muted></video>
        <p class="scan-sell-status" data-scan-status>Apunta la cámara a un código QR de producto.</p>
      </div>
      <div class="scan-sell-cart">
        <h3>Venta actual</h3>
        <div class="scan-sell-cart-list" data-cart-list><p class="empty-state">Todavía no escaneaste ningún producto.</p></div>
        <p class="scan-sell-total" data-cart-total>Total: ${currency.format(0)}</p>
        <button class="btn btn-primary" type="button" data-finish-sale disabled>Finalizar venta</button>
        <button class="btn btn-ghost" type="button" data-clear-cart disabled>Vaciar</button>
        <p class="scan-sell-result" data-scan-result></p>
      </div>
    </div>
  `;

  const video = container.querySelector('[data-scan-video]');
  const scanStatus = container.querySelector('[data-scan-status]');
  const cartList = container.querySelector('[data-cart-list]');
  const cartTotalEl = container.querySelector('[data-cart-total]');
  const finishButton = container.querySelector('[data-finish-sale]');
  const clearButton = container.querySelector('[data-clear-cart]');
  const resultEl = container.querySelector('[data-scan-result]');

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  const paintCart = () => {
    const entries = [...cart.values()];
    cartList.innerHTML = entries.length
      ? entries.map((entry) => `
          <div class="scan-cart-row">
            <span class="scan-cart-name">${entry.nombre}</span>
            <span class="scan-cart-qty">
              <button type="button" class="btn btn-ghost btn-small" data-dec="${entry.producto_id}">−</button>
              ${entry.cantidad}
              <button type="button" class="btn btn-ghost btn-small" data-inc="${entry.producto_id}">+</button>
            </span>
            <span class="scan-cart-subtotal">${currency.format(entry.precio * entry.cantidad)}</span>
          </div>
        `).join('')
      : '<p class="empty-state">Todavía no escaneaste ningún producto.</p>';

    const total = entries.reduce((sum, entry) => sum + entry.precio * entry.cantidad, 0);
    cartTotalEl.textContent = `Total: ${currency.format(total)}`;
    finishButton.disabled = entries.length === 0;
    clearButton.disabled = entries.length === 0;

    cartList.querySelectorAll('[data-inc]').forEach((button) => {
      button.addEventListener('click', () => {
        const entry = cart.get(button.dataset.inc);
        const product = productBySlug.get(entry.slug);
        if (entry.cantidad >= product.stock) {
          setStatus(`No hay más stock de "${entry.nombre}" (quedan ${product.stock}).`, true);
          return;
        }
        entry.cantidad += 1;
        paintCart();
      });
    });
    cartList.querySelectorAll('[data-dec]').forEach((button) => {
      button.addEventListener('click', () => {
        const entry = cart.get(button.dataset.dec);
        entry.cantidad -= 1;
        if (entry.cantidad <= 0) cart.delete(button.dataset.dec);
        paintCart();
      });
    });
  };

  const lastScanAt = new Map();

  const handleScan = (slug) => {
    const product = productBySlug.get(slug);

    if (!product || !product.activo) {
      scanStatus.textContent = `Código no reconocido: "${slug}".`;
      return;
    }

    const now = Date.now();
    if (now - (lastScanAt.get(slug) ?? 0) < RESCAN_DELAY_MS) return;
    lastScanAt.set(slug, now);

    if (product.stock <= 0) {
      scanStatus.textContent = `Sin stock: "${product.nombre}" está agotado.`;
      return;
    }

    const existing = cart.get(product.id);
    if (existing) {
      if (existing.cantidad >= product.stock) {
        scanStatus.textContent = `No hay más stock de "${product.nombre}" (quedan ${product.stock}).`;
        return;
      }
      existing.cantidad += 1;
    } else {
      cart.set(product.id, {
        producto_id: product.id,
        slug: product.slug,
        nombre: product.nombre,
        precio: product.precio,
        cantidad: 1
      });
    }
    scanStatus.textContent = `Agregado: ${product.nombre}.`;
    paintCart();
  };

  let stream = null;
  let stopped = false;

  const scanLoop = () => {
    if (stopped || !document.contains(video)) {
      stream?.getTracks().forEach((track) => track.stop());
      return;
    }

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      if (code?.data) handleScan(code.data.trim());
    }

    requestAnimationFrame(scanLoop);
  };

  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
    video.srcObject = stream;
    await video.play();
    requestAnimationFrame(scanLoop);
  } catch (error) {
    scanStatus.textContent = 'No se pudo acceder a la cámara. Revisa los permisos del navegador.';
  }

  finishButton.addEventListener('click', async () => {
    finishButton.disabled = true;
    resultEl.textContent = '';
    resultEl.classList.remove('status-error');
    try {
      const items = [...cart.values()];
      const total = items.reduce((sum, item) => sum + item.precio * item.cantidad, 0);
      await recordDirectSale({ items, total });
      cart.clear();
      paintCart();
      setStatus('Venta registrada y stock actualizado.');
      scanStatus.textContent = 'Venta registrada. Apunta la cámara al siguiente producto.';
      resultEl.textContent = '✅ Venta registrada y stock actualizado.';
      resultEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch (error) {
      setStatus('No se pudo registrar la venta.', true);
      resultEl.textContent = '❌ No se pudo registrar la venta. Intenta de nuevo.';
      resultEl.classList.add('status-error');
      resultEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      finishButton.disabled = false;
    }
  });

  clearButton.addEventListener('click', () => {
    if (!window.confirm('¿Vaciar la venta actual?')) return;
    cart.clear();
    paintCart();
  });

  paintCart();
};
