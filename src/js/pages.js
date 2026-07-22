import { getBannerImage, getLogoImage, getProductImage } from './assets.js';
import { formatPrice, getCategories, getFeaturedProducts, getProductBySlug, getProducts } from './data.js';
import { icon, pageShell, productCard, sectionHeading, setupNavigation, whatsappLink } from './components.js';

const app = () => document.querySelector('#app');

export const renderHome = (config) => {
  const categories = getCategories();
  const featured = getFeaturedProducts();

  app().innerHTML = pageShell(config, 'home', `
    <section class="hero">
      <div class="hero-copy">
        <span class="eyebrow">${config.empresa}</span>
        <h1>${config.eslogan}</h1>
        <p>Un catálogo curado de productos biodegradables, orgánicos y de cuidado personal para comprar con calma, confianza y propósito.</p>
        <div class="hero-actions">
          <a class="btn btn-primary" href="catalogo.html">Ver catálogo ${icon('arrow')}</a>
          <a class="btn btn-ghost" href="contacto.html">Consultar ahora</a>
        </div>
      </div>
      <div class="hero-image" aria-label="Productos naturales Saviare">
        <img class="hero-logo" src="${getLogoImage(config.logo)}" alt="${config.empresa}" />
        <img src="${getBannerImage('hero-saviare.svg')}" alt="Selección elegante de productos naturales Saviare" />
      </div>
    </section>

    <section class="section">
      ${sectionHeading('Categorías', 'Explora por intención', 'Productos organizados para que cada rutina sea sencilla de encontrar.')}
      <div class="category-grid">
        ${categories.map((category) => `
          <a class="category-tile" href="catalogo.html?categoria=${encodeURIComponent(category.nombre)}">
            ${icon('leaf')}
            <h3>${category.nombre}</h3>
            <p>${category.descripcion}</p>
          </a>
        `).join('')}
      </div>
    </section>

    <section class="section tinted">
      ${sectionHeading('Destacados', 'Favoritos para empezar', 'Una selección inicial lista para consulta directa por WhatsApp.')}
      <div class="product-grid">${featured.map(productCard).join('')}</div>
    </section>

    <section class="section split">
      <div>
        ${sectionHeading('Beneficios', 'Cuidado que se siente bien', 'Saviare está pensada para personas que valoran calidad, estética y decisiones más responsables.')}
      </div>
      <div class="benefit-list">
        ${['Ingredientes seleccionados', 'Alternativas biodegradables', 'Atención online cercana', 'Catálogo fácil de actualizar'].map((item) => `
          <article class="benefit-item">${icon('spark')}<span>${item}</span></article>
        `).join('')}
      </div>
    </section>

    <section class="cta">
      <span>${config.empresa}</span>
      <h2>Elige productos con intención, sin perder elegancia.</h2>
      <a class="btn btn-primary" href="catalogo.html">Descubrir productos ${icon('arrow')}</a>
    </section>
  `);
  setupNavigation();
};

export const renderCatalog = (config) => {
  const params = new URLSearchParams(window.location.search);
  const initialCategory = params.get('categoria') || 'Todas';
  const products = getProducts();
  const categories = ['Todas', ...new Set(products.map((product) => product.categoria))];

  app().innerHTML = pageShell(config, 'catalogo', `
    <section class="page-hero compact">
      <span class="eyebrow">Catálogo</span>
      <h1>Productos seleccionados para una vida consciente</h1>
      <p>Busca, filtra y ordena el catálogo. Cada producto dirige a WhatsApp para una atención personalizada.</p>
    </section>
    <section class="catalog-layout">
      <aside class="catalog-tools" aria-label="Filtros del catálogo">
        <label class="field">${icon('search')}<input data-search type="search" placeholder="Buscar producto" /></label>
        <label class="field">${icon('filter')}
          <select data-category>
            ${categories.map((category) => `<option ${category === initialCategory ? 'selected' : ''}>${category}</option>`).join('')}
          </select>
        </label>
        <label class="field">
          <select data-sort aria-label="Ordenar productos">
            <option value="nombre-asc">Nombre A-Z</option>
            <option value="nombre-desc">Nombre Z-A</option>
            <option value="precio-asc">Precio menor</option>
            <option value="precio-desc">Precio mayor</option>
          </select>
        </label>
      </aside>
      <div>
        <div class="catalog-meta"><strong data-count></strong><span>Productos activos</span></div>
        <div class="product-grid" data-catalog-grid></div>
      </div>
    </section>
  `);

  const search = document.querySelector('[data-search]');
  const category = document.querySelector('[data-category]');
  const sort = document.querySelector('[data-sort]');
  const grid = document.querySelector('[data-catalog-grid]');
  const count = document.querySelector('[data-count]');

  const render = () => {
    const term = search.value.trim().toLowerCase();
    const selectedCategory = category.value;
    const sorted = [...products]
      .filter((product) => selectedCategory === 'Todas' || product.categoria === selectedCategory)
      .filter((product) => `${product.nombre} ${product.descripcion}`.toLowerCase().includes(term))
      .sort((a, b) => {
        const [key, direction] = sort.value.split('-');
        const result = key === 'precio' ? a.precio - b.precio : a.nombre.localeCompare(b.nombre, 'es');
        return direction === 'desc' ? -result : result;
      });

    count.textContent = sorted.length;
    grid.innerHTML = sorted.length
      ? sorted.map(productCard).join('')
      : '<p class="empty-state">No encontramos productos con esos filtros.</p>';
  };

  [search, category, sort].forEach((control) => control.addEventListener('input', render));
  render();
  setupNavigation();
};

export const renderProduct = (config) => {
  const params = new URLSearchParams(window.location.search);
  const product = getProductBySlug(params.get('producto')) || getProducts()[0];
  const related = getProducts().filter((item) => item.categoria === product.categoria && item.id !== product.id).slice(0, 3);
  document.title = `${product.nombre} | ${config.empresa}`;

  app().innerHTML = pageShell(config, 'catalogo', `
    <section class="product-detail">
      <div class="gallery">
        <img class="gallery-main" src="${getProductImage(product.imagenPrincipal)}" alt="${product.nombre}" />
        <div class="gallery-thumbs">
          ${product.imagenes.map((image) => `<img src="${getProductImage(image)}" alt="${product.nombre}" loading="lazy" />`).join('')}
        </div>
      </div>
      <article class="product-info">
        <span class="pill">${product.categoria}</span>
        <h1>${product.nombre}</h1>
        <strong class="price">${formatPrice(product.precio)}</strong>
        <p>${product.descripcion}</p>
        <a class="btn btn-primary" href="${whatsappLink(config, product.nombre)}" target="_blank" rel="noreferrer">${icon('message')} Consultar por WhatsApp</a>
      </article>
    </section>
    <section class="section detail-grid">
      ${detailList('Beneficios', product.beneficios)}
      ${detailList('Ingredientes', product.ingredientes)}
      <article class="detail-card"><h2>Modo de uso</h2><p>${product.modoUso}</p></article>
    </section>
    <section class="section">
      ${sectionHeading('Relacionados', 'También podría interesarte')}
      <div class="product-grid">${(related.length ? related : getFeaturedProducts().slice(0, 3)).map(productCard).join('')}</div>
    </section>
  `);
  setupNavigation();
};

export const renderAbout = (config) => {
  const blocks = [
    ['Historia', config.historia],
    ['Misión', config.mision],
    ['Visión', config.vision],
    ['Compromiso ambiental', config.compromisoAmbiental]
  ];

  app().innerHTML = pageShell(config, 'nosotros', `
    <section class="page-hero">
      <span class="eyebrow">Nosotros</span>
      <h1>Una marca creada para comprar bienestar con confianza</h1>
      <p>Esta página queda lista para editar la narrativa de marca sin intervenir el código.</p>
    </section>
    <section class="story-grid">
      ${blocks.map(([title, copy]) => `<article class="story-card"><h2>${title}</h2><p>${copy}</p></article>`).join('')}
      <article class="story-card values"><h2>Valores</h2>${config.valores.map((value) => `<span>${value}</span>`).join('')}</article>
    </section>
  `);
  setupNavigation();
};

export const renderContact = (config) => {
  app().innerHTML = pageShell(config, 'contacto', `
    <section class="page-hero compact">
      <span class="eyebrow">Contacto</span>
      <h1>Atención online para elegir mejor</h1>
      <p>Escríbenos para consultar disponibilidad, recomendaciones o próximos lanzamientos.</p>
    </section>
    <section class="contact-layout">
      <div class="contact-panel">
        ${contactLink('WhatsApp', whatsappLink(config), config.telefono, 'message')}
        ${contactLink('Instagram', config.instagram, '@saviare', 'heart')}
        ${contactLink('Facebook', config.facebook, 'Saviare', 'leaf')}
        ${contactLink('TikTok', config.tiktok, '@saviare', 'spark')}
        ${contactLink('Correo', `mailto:${config.correo}`, config.correo, 'mail')}
      </div>
      <form class="contact-form" aria-label="Formulario visual de contacto">
        <label>Nombre<input type="text" placeholder="Tu nombre" /></label>
        <label>Correo<input type="email" placeholder="tu@email.com" /></label>
        <label>Mensaje<textarea rows="5" placeholder="Cuéntanos qué estás buscando"></textarea></label>
        <button class="btn btn-primary" type="button">Enviar consulta visual ${icon('arrow')}</button>
      </form>
      <div class="map-placeholder" role="img" aria-label="Mapa referencial">
        <span>${config.direccion}</span>
      </div>
    </section>
  `);
  setupNavigation();
};

const detailList = (title, items) => `
  <article class="detail-card">
    <h2>${title}</h2>
    <ul>${items.map((item) => `<li>${item}</li>`).join('')}</ul>
  </article>
`;

const contactLink = (label, href, value, iconName) => `
  <a class="contact-link" href="${href}" target="${href.startsWith('mailto:') ? '_self' : '_blank'}" rel="noreferrer">
    ${icon(iconName)}
    <span>${label}</span>
    <strong>${value}</strong>
  </a>
`;
