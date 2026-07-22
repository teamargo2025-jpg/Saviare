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

routes[page]?.(config);
