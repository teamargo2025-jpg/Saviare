import { getComprobanteUrl, listAllPedidos, uploadComprobante } from '../api.js';

const formatDate = (value) =>
  new Intl.DateTimeFormat('es-PE', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value));

const formatTime = (value) =>
  new Intl.DateTimeFormat('es-PE', { hour: '2-digit', minute: '2-digit' }).format(new Date(value));

const formatPrice = (value) =>
  new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(value);

const itemsSummary = (items) =>
  (items ?? []).map((item) => `${item.cantidad}x ${item.nombre}`).join(', ');

const origenLabel = (origen) => (origen === 'qr' ? 'En persona (QR)' : 'WhatsApp');

export const renderHistorialView = async (container, setStatus) => {
  container.innerHTML = '<p class="empty-state">Cargando historial…</p>';

  const pedidos = await listAllPedidos();
  const ventas = pedidos
    .filter((pedido) => pedido.estado === 'confirmado')
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const paint = () => {
    const table = container.querySelector('[data-historial-table]');

    if (!ventas.length) {
      table.innerHTML = '<p class="empty-state">Todavía no hay ventas concretadas.</p>';
      return;
    }

    table.innerHTML = `
      <div class="historial-table-wrap">
      <table class="historial-table">
        <thead>
          <tr>
            <th>Estado</th>
            <th>Fecha</th>
            <th>Hora</th>
            <th>Canal</th>
            <th>Productos</th>
            <th>Total</th>
            <th>Comprobante</th>
          </tr>
        </thead>
        <tbody>
          ${ventas.map((venta) => `
            <tr>
              <td><span class="status-badge status-confirmado">Concretada</span></td>
              <td>${formatDate(venta.created_at)}</td>
              <td>${formatTime(venta.created_at)}</td>
              <td>${origenLabel(venta.origen)}</td>
              <td class="historial-productos">${itemsSummary(venta.items)}</td>
              <td>${formatPrice(venta.total)}</td>
              <td>
                ${venta.comprobante_url
                  ? `<button class="text-link" type="button" data-view-comprobante="${venta.id}">✅ Ver comprobante</button>`
                  : `<label class="text-link comprobante-upload comprobante-missing">
                       ⚠️ Falta subir
                       <input type="file" accept="image/*" data-upload-comprobante="${venta.id}" hidden />
                     </label>`
                }
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      </div>
    `;

    table.querySelectorAll('[data-view-comprobante]').forEach((button) => {
      button.addEventListener('click', () => handleViewComprobante(button.dataset.viewComprobante));
    });
    table.querySelectorAll('[data-upload-comprobante]').forEach((input) => {
      input.addEventListener('change', (event) => handleUploadComprobante(input.dataset.uploadComprobante, event.target.files[0]));
    });
  };

  const handleUploadComprobante = async (id, file) => {
    if (!file) return;
    try {
      const path = await uploadComprobante(file, id);
      const venta = ventas.find((item) => item.id === id);
      if (venta) venta.comprobante_url = path;
      setStatus('Comprobante adjuntado.');
      paint();
    } catch (error) {
      setStatus('No se pudo subir el comprobante.', true);
    }
  };

  const handleViewComprobante = async (id) => {
    const venta = ventas.find((item) => item.id === id);
    if (!venta?.comprobante_url) return;
    try {
      const url = await getComprobanteUrl(venta.comprobante_url);
      window.open(url, '_blank', 'noopener');
    } catch (error) {
      setStatus('No se pudo abrir el comprobante.', true);
    }
  };

  container.innerHTML = `
    <div class="admin-toolbar admin-toolbar-noprint">
      <p class="qr-hint">${ventas.length} venta(s) concretada(s) en total.</p>
    </div>
    <div data-historial-table></div>
  `;

  paint();
};
