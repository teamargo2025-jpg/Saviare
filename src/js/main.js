import '../css/styles.css';
import { getConfig } from './data.js';
import { renderAbout, renderCatalog, renderContact, renderHome, renderProduct } from './pages.js';

const config = getConfig();
const page = document.body.dataset.page;

const routes = {
  home: renderHome,
  catalogo: renderCatalog,
  producto: renderProduct,
  nosotros: renderAbout,
  contacto: renderContact
};

routes[page]?.(config).catch((error) => {
  console.error('No se pudo cargar la página:', error);
  const app = document.querySelector('#app');
  if (app) app.innerHTML = '<p class="empty-state">No pudimos cargar el catálogo en este momento. Intenta de nuevo en unos minutos.</p>';
});
