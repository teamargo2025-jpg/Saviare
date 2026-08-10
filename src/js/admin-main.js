import '../css/styles.css';
import { getConfig } from './data.js';
import { isAdminSession, onAuthChange, signIn, signOut } from './admin/session.js';
import { renderProductsView } from './admin/views/products.js';
import { renderCategoriesView } from './admin/views/categories.js';
import { renderReviewsView } from './admin/views/reviews.js';
import { renderPedidosView } from './admin/views/pedidos.js';
import { renderQrCodesView } from './admin/views/qr-codes.js';
import { renderScanSellView } from './admin/views/scan-sell.js';
import { icon } from './components.js';

const config = getConfig();
const root = () => document.querySelector('#admin-app');
const panelControlUrl = import.meta.env.VITE_PANEL_CONTROL_URL || 'http://localhost:5174';

const TABS = [
  { id: 'productos', label: 'Productos', render: renderProductsView },
  { id: 'pedidos', label: 'Pedidos', render: renderPedidosView },
  { id: 'vender', label: 'Vender (escanear)', render: renderScanSellView },
  { id: 'qr', label: 'Códigos QR', render: renderQrCodesView },
  { id: 'categorias', label: 'Categorías', render: renderCategoriesView },
  { id: 'resenas', label: 'Reseñas', render: renderReviewsView }
];

let activeTab = TABS[0].id;

const renderLogin = (errorMessage = '') => {
  root().innerHTML = `
    <div class="admin-login">
      <form class="contact-form login-card" data-login-form>
        <span class="eyebrow">${config.empresa}</span>
        <h1>Acceso administrador</h1>
        <label>Correo<input data-login-email type="email" required autocomplete="username" /></label>
        <label>Contraseña
          <span class="password-field">
            <input data-login-password type="password" required autocomplete="current-password" />
            <button class="password-toggle" type="button" data-toggle-password aria-label="Mostrar contraseña">${icon('eye')}</button>
          </span>
        </label>
        <button class="btn btn-primary" type="submit">Ingresar</button>
        <p class="status-message ${errorMessage ? 'status-error' : ''}" data-login-status>${errorMessage}</p>
      </form>
    </div>
  `;

  root().querySelector('[data-toggle-password]').addEventListener('click', (event) => {
    const button = event.currentTarget;
    const input = root().querySelector('[data-login-password]');
    const showing = input.type === 'text';
    input.type = showing ? 'password' : 'text';
    button.innerHTML = icon(showing ? 'eye' : 'eye-off');
    button.setAttribute('aria-label', showing ? 'Mostrar contraseña' : 'Ocultar contraseña');
  });

  root().querySelector('[data-login-form]').addEventListener('submit', async (event) => {
    event.preventDefault();
    const status = root().querySelector('[data-login-status]');
    const email = root().querySelector('[data-login-email]').value.trim();
    const password = root().querySelector('[data-login-password]').value;
    try {
      await signIn(email, password);
    } catch (error) {
      status.textContent = 'No pudimos iniciar sesión. Revisa tus credenciales.';
      status.classList.add('status-error');
    }
  });
};

const renderPanel = (session) => {
  root().innerHTML = `
    <div class="admin-shell">
      <header class="admin-header">
        <span class="eyebrow">${config.empresa} · Administración</span>
        <div class="admin-header-actions">
          <span>${session.user.email}</span>
          <a class="btn btn-ghost" href="${panelControlUrl}" target="_blank" rel="noopener">Panel de control</a>
          <button class="btn btn-ghost" type="button" data-logout>Cerrar sesión</button>
        </div>
      </header>
      <nav class="admin-tabs">
        ${TABS.map((tab) => `<button type="button" class="admin-tab ${tab.id === activeTab ? 'active' : ''}" data-tab="${tab.id}">${tab.label}</button>`).join('')}
      </nav>
      <p class="status-message" data-admin-status></p>
      <div class="admin-content" data-admin-content></div>
    </div>
  `;

  root().querySelector('[data-logout]').addEventListener('click', () => signOut());
  root().querySelectorAll('[data-tab]').forEach((button) => {
    button.addEventListener('click', () => {
      activeTab = button.dataset.tab;
      renderPanel(session);
    });
  });

  const status = root().querySelector('[data-admin-status]');
  const setStatus = (message, isError = false) => {
    status.textContent = message;
    status.classList.toggle('status-error', Boolean(isError));
  };

  const content = root().querySelector('[data-admin-content]');
  const tab = TABS.find((item) => item.id === activeTab);
  tab.render(content, setStatus);
};

onAuthChange((session) => {
  activeTab = TABS[0].id;
  if (isAdminSession(session)) {
    renderPanel(session);
  } else {
    renderLogin(session ? 'Esta cuenta no tiene acceso al panel.' : '');
  }
});
