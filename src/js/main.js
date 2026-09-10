import '../css/styles.css';
import { instalarAnalitica } from './analitica.js';
import { instalarRedDeErrores } from './error-global.js';
import { getConfig } from './data.js';
import { renderAbout, renderCatalog, renderContact, renderHome, renderProduct } from './pages.js';
import { renderPrivacidad, renderTerminos } from './legal.js';
import { renderGracias, renderNoEncontrado } from './pages-estado.js';

instalarRedDeErrores();
instalarAnalitica();

const config = getConfig();
const page = document.body.dataset.page;

const routes = {
  home: renderHome,
  catalogo: renderCatalog,
  producto: renderProduct,
  nosotros: renderAbout,
  contacto: renderContact,
  privacidad: renderPrivacidad,
  terminos: renderTerminos,
  gracias: renderGracias,
  error404: renderNoEncontrado
};

routes[page]?.(config).catch((error) => {
  console.error('No se pudo cargar la página:', error);
  const app = document.querySelector('#app');
  if (app) app.innerHTML = '<p class="empty-state">No pudimos cargar el catálogo en este momento. Intenta de nuevo en unos minutos.</p>';
});
