import { cancelPedido, confirmPedido, listAllPedidos } from '../api.js';

const TABS = [
  { id: 'pendiente', label: 'Pendientes' },
  { id: 'confirmado', label: 'Confirmados' },
  { id: 'cancelado', label: 'Cancelados' }
];

const formatDate = (value) =>
  new Intl.DateTimeFormat('es-PE', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value));

const formatPrice = (value) =>
  new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(value);

const itemsSummary = (items) =>
  (items ?? []).map((item) => `<li>${item.cantidad}x ${item.nombre} (${formatPrice(item.precio)} c/u)</li>`).join('');

const actionsFor = (pedido) => {
  if (pedido.estado !== 'pendiente') return '';
  return `
    <button class="btn btn-ghost" type="button" data-confirm="${pedido.id}">Confirmar</button>
    <button class="btn btn-ghost" type="button" data-cancel="${pedido.id}">Cancelar</button>
  `;
};

export const renderPedidosView = async (container, setStatus) => {
  container.innerHTML = '<p class="empty-state">Cargando pedidos…</p>';
  const pedidos = await listAllPedidos();

  let activeTab = 'pendiente';

  const paint = () => {
    const filtered = pedidos.filter((pedido) => pedido.estado === activeTab);
    const list = container.querySelector('[data-pedido-admin-list]');
    list.innerHTML = filtered.length ? filtered.map((pedido) => `
      <article class="detail-card admin-row pedido-card">
        <div class="admin-row-body">
          <span class="status-badge status-${pedido.estado}">${pedido.estado}</span>
          <h3>${formatPrice(pedido.total)}</h3>
          <p>${formatDate(pedido.created_at)}</p>
          <ul>${itemsSummary(pedido.items)}</ul>
        </div>
        <div class="admin-actions">${actionsFor(pedido)}</div>
      </article>
    `).join('') : '<p class="empty-state">No hay pedidos en este estado.</p>';

    list.querySelectorAll('[data-confirm]').forEach((button) => {
      button.addEventListener('click', () => handleConfirm(button.dataset.confirm));
    });
    list.querySelectorAll('[data-cancel]').forEach((button) => {
      button.addEventListener('click', () => handleCancel(button.dataset.cancel));
    });
  };

  const handleConfirm = async (id) => {
    const pedido = pedidos.find((item) => item.id === id);
    if (!pedido) return;
    if (!window.confirm('¿Confirmar este pedido? Esto descuenta el stock de cada producto.')) return;

    try {
      await confirmPedido(pedido);
      pedido.estado = 'confirmado';
      setStatus('Pedido confirmado y stock actualizado.');
      paint();
    } catch (error) {
      setStatus('No se pudo confirmar el pedido.', true);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('¿Cancelar este pedido? No se tocará el stock.')) return;

    try {
      await cancelPedido(id);
      const pedido = pedidos.find((item) => item.id === id);
      if (pedido) pedido.estado = 'cancelado';
      setStatus('Pedido cancelado.');
      paint();
    } catch (error) {
      setStatus('No se pudo cancelar el pedido.', true);
    }
  };

  container.innerHTML = `
    <nav class="admin-tabs" data-pedido-tabs>
      ${TABS.map((tab) => `<button type="button" class="admin-tab ${tab.id === activeTab ? 'active' : ''}" data-pedido-tab="${tab.id}">${tab.label}</button>`).join('')}
    </nav>
    <div class="admin-list" data-pedido-admin-list></div>
  `;

  container.querySelectorAll('[data-pedido-tab]').forEach((button) => {
    button.addEventListener('click', () => {
      activeTab = button.dataset.pedidoTab;
      container.querySelectorAll('[data-pedido-tab]').forEach((btn) => btn.classList.toggle('active', btn.dataset.pedidoTab === activeTab));
      paint();
    });
  });

  paint();
};
