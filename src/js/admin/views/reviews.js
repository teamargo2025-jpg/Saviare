import { deleteReview, listAllReviews, setReviewStatus } from '../api.js';

const TABS = [
  { id: 'pendiente', label: 'Pendientes' },
  { id: 'aprobada', label: 'Aprobadas' },
  { id: 'oculta', label: 'Ocultas' }
];

const formatDate = (value) =>
  new Intl.DateTimeFormat('es-PE', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value));

const actionsFor = (review) => {
  const buttons = [];
  if (review.estado !== 'aprobada') buttons.push(`<button class="btn btn-ghost" type="button" data-approve="${review.id}">Aprobar</button>`);
  if (review.estado !== 'oculta') buttons.push(`<button class="btn btn-ghost" type="button" data-hide="${review.id}">Ocultar</button>`);
  buttons.push(`<button class="btn btn-ghost" type="button" data-delete="${review.id}">Eliminar</button>`);
  return buttons.join('');
};

export const renderReviewsView = async (container, setStatus) => {
  container.innerHTML = '<p class="empty-state">Cargando reseñas…</p>';
  const reviews = await listAllReviews();

  let activeTab = 'pendiente';

  const paint = () => {
    const filtered = reviews.filter((review) => review.estado === activeTab);
    const list = container.querySelector('[data-review-admin-list]');
    list.innerHTML = filtered.length ? filtered.map((review) => `
      <article class="detail-card admin-row review-card">
        <div class="admin-row-body">
          <span class="status-badge status-${review.estado}">${review.estado}</span>
          <h3>${review.productos?.nombre ?? 'Producto eliminado'}</h3>
          <p><strong>${review.calificacion}/5</strong> · ${review.nombre_cliente} · ${formatDate(review.created_at)}</p>
          <p>${review.comentario ?? ''}</p>
        </div>
        <div class="admin-actions">${actionsFor(review)}</div>
      </article>
    `).join('') : '<p class="empty-state">No hay reseñas en este estado.</p>';

    list.querySelectorAll('[data-approve]').forEach((button) => {
      button.addEventListener('click', () => updateStatus(button.dataset.approve, 'aprobada'));
    });
    list.querySelectorAll('[data-hide]').forEach((button) => {
      button.addEventListener('click', () => updateStatus(button.dataset.hide, 'oculta'));
    });
    list.querySelectorAll('[data-delete]').forEach((button) => {
      button.addEventListener('click', () => removeReview(button.dataset.delete));
    });
  };

  const updateStatus = async (id, estado) => {
    try {
      await setReviewStatus(id, estado);
      const review = reviews.find((item) => item.id === id);
      review.estado = estado;
      setStatus('Reseña actualizada.');
      paint();
    } catch (error) {
      setStatus('No se pudo actualizar la reseña.', true);
    }
  };

  const removeReview = async (id) => {
    if (!window.confirm('¿Eliminar esta reseña de forma permanente?')) return;
    try {
      await deleteReview(id);
      const index = reviews.findIndex((item) => item.id === id);
      reviews.splice(index, 1);
      setStatus('Reseña eliminada.');
      paint();
    } catch (error) {
      setStatus('No se pudo eliminar la reseña.', true);
    }
  };

  container.innerHTML = `
    <nav class="admin-tabs" data-review-tabs>
      ${TABS.map((tab) => `<button type="button" class="admin-tab ${tab.id === activeTab ? 'active' : ''}" data-review-tab="${tab.id}">${tab.label}</button>`).join('')}
    </nav>
    <div class="admin-list" data-review-admin-list></div>
  `;

  container.querySelectorAll('[data-review-tab]').forEach((button) => {
    button.addEventListener('click', () => {
      activeTab = button.dataset.reviewTab;
      container.querySelectorAll('[data-review-tab]').forEach((btn) => btn.classList.toggle('active', btn.dataset.reviewTab === activeTab));
      paint();
    });
  });

  paint();
};
