import { getBannerImage, getLogoImage, getSocialImage } from './assets.js';
import {
  formatPrice,
  getApprovedReviews,
  getCategories,
  getFeaturedProducts,
  getProductBySlug,
  getProducts,
  submitReview
} from './data.js';
import { addToCartButton, icon, lowStockBadge, pageShell, productCard, sectionHeading, setupNavigation, starRating, whatsappLink } from './components.js';
import { escapeHtml } from '../utils/sanitize.js';
import { setupCart } from './cart-ui.js';

const app = () => document.querySelector('#app');

export const renderHome = async (config) => {
  const [categories, featured] = await Promise.all([getCategories(), getFeaturedProducts()]);

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
  setupCart(config);
};

export const renderCatalog = async (config) => {
  const params = new URLSearchParams(window.location.search);
  const initialCategory = params.get('categoria') || 'Todas';
  const products = await getProducts();
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
  setupCart(config);
};

export const renderProduct = async (config) => {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('producto');
  const products = await getProducts();
  const product = (slug ? await getProductBySlug(slug) : null) || products[0];

  if (!product) {
    app().innerHTML = pageShell(config, 'catalogo', '<section class="section"><p class="empty-state">Producto no encontrado.</p></section>');
    setupNavigation();
    setupCart(config);
    return;
  }

  const related = products.filter((item) => item.categoria === product.categoria && item.id !== product.id).slice(0, 3);
  const reviews = await getApprovedReviews(product.id);
  document.title = `${product.nombre} | ${config.empresa}`;

  app().innerHTML = pageShell(config, 'catalogo', `
    <section class="product-detail">
      <div class="gallery">
        <img class="gallery-main" src="${product.imagenPrincipal}" alt="${product.nombre}" />
        <div class="gallery-thumbs">
          ${product.imagenes.map((image) => `<img src="${image}" alt="${product.nombre}" loading="lazy" />`).join('')}
        </div>
      </div>
      <article class="product-info">
        <div class="product-card-tags">
          <span class="pill">${product.categoria}</span>
          ${product.disponible === false ? '<span class="pill pill-muted">Agotado</span>' : lowStockBadge(product)}
        </div>
        <h1>${product.nombre}</h1>
        <strong class="price">${formatPrice(product.precio)}</strong>
        <p>${product.descripcion}</p>
        <div class="product-order-actions">
          ${product.disponible === false ? '' : `
            <div class="qty-stepper" data-qty-stepper>
              <button type="button" data-qty-decrease aria-label="Reducir cantidad">${icon('minus')}</button>
              <input type="number" min="1" value="1" data-qty-input aria-label="Cantidad" />
              <button type="button" data-qty-increase aria-label="Aumentar cantidad">${icon('plus')}</button>
            </div>
          `}
          ${addToCartButton(product, { className: 'btn-primary' })}
        </div>
        <a class="btn btn-ghost" href="${whatsappLink(config, product.nombre)}" target="_blank" rel="noreferrer">${icon('message')} Consultar por WhatsApp</a>
      </article>
    </section>
    <section class="section detail-grid">
      ${detailList('Beneficios', product.beneficios)}
      ${detailList('Ingredientes', product.ingredientes)}
      <article class="detail-card"><h2>Modo de uso</h2><p>${product.modoUso}</p></article>
    </section>
    <section class="section">
      ${sectionHeading('Reseñas', 'Lo que dicen quienes ya lo probaron')}
      ${reviewsSection(reviews)}
    </section>
    <section class="section">
      ${sectionHeading('Relacionados', 'También podría interesarte')}
      <div class="product-grid">${(related.length ? related : (await getFeaturedProducts()).slice(0, 3)).map(productCard).join('')}</div>
    </section>
  `);
  setupNavigation();
  setupCart(config);
  setupReviewForm(product.id);
  setupProductQty();
};

export const renderAbout = async (config) => {
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
  setupCart(config);
};

export const renderContact = async (config) => {
  app().innerHTML = pageShell(config, 'contacto', `
    <section class="page-hero compact">
      <span class="eyebrow">Contacto</span>
      <h1>Atención online para elegir mejor</h1>
      <p>Escríbenos para consultar disponibilidad, recomendaciones o próximos lanzamientos.</p>
    </section>
    <section class="contact-layout">
      <div class="contact-panel">
        ${contactLink('WhatsApp', whatsappLink(config), config.telefono, 'message')}
        ${socialLink('Instagram', config.instagram, config.instagramHandle, 'instagram', 'qr-instagram.jpg')}
        ${socialLink('Facebook', config.facebook, config.facebookHandle, 'facebook')}
        ${socialLink('TikTok', config.tiktok, config.tiktokHandle, 'tiktok', 'qr-tiktok.jpg')}
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
  setupCart(config);
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

const socialLink = (label, href, handle, iconName, qrFile) => `
  <a class="contact-link ${qrFile ? 'has-qr' : ''}" href="${href}" target="_blank" rel="noreferrer">
    ${qrFile ? `<img class="contact-qr" src="${getSocialImage(qrFile)}" alt="Código QR para seguir a Saviare en ${label}" loading="lazy" />` : ''}
    <span class="contact-link-body">
      ${icon(iconName)}
      <span>${label}</span>
      <strong>${handle}</strong>
    </span>
  </a>
`;

const formatReviewDate = (value) =>
  new Intl.DateTimeFormat('es-PE', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(value));

const reviewsSection = (reviews) => `
  <div class="review-list" data-review-list>
    ${reviews.length
      ? reviews.map((review) => `
        <article class="detail-card review-card">
          ${starRating(review.calificacion)}
          <p>${escapeHtml(review.comentario)}</p>
          <div class="review-meta">
            <strong>${escapeHtml(review.nombre_cliente)}</strong>
            <span>${formatReviewDate(review.created_at)}</span>
          </div>
        </article>
      `).join('')
      : '<p class="empty-state">Todavía no hay reseñas para este producto. ¡Sé la primera persona en opinar!</p>'}
  </div>
  <form class="contact-form review-form" data-review-form aria-label="Escribir una reseña">
    <label>Nombre<input data-review-name type="text" placeholder="Tu nombre" required maxlength="80" /></label>
    <label>Calificación
      <select data-review-rating required>
        <option value="5">5 - Excelente</option>
        <option value="4">4 - Muy bueno</option>
        <option value="3">3 - Bueno</option>
        <option value="2">2 - Regular</option>
        <option value="1">1 - Malo</option>
      </select>
    </label>
    <label>Comentario<textarea data-review-comment rows="4" placeholder="Cuéntanos tu experiencia" required maxlength="500"></textarea></label>
    <button class="btn btn-primary" type="submit">Enviar reseña ${icon('arrow')}</button>
    <p class="review-form-note" data-review-note></p>
  </form>
`;

const setupProductQty = () => {
  const stepper = document.querySelector('[data-qty-stepper]');
  const addButton = document.querySelector('.product-info [data-add-cart]');
  if (!stepper || !addButton) return;

  const input = stepper.querySelector('[data-qty-input]');
  const syncQty = () => {
    const value = Math.max(1, Number(input.value) || 1);
    input.value = value;
    addButton.dataset.cartQty = value;
  };

  stepper.querySelector('[data-qty-increase]').addEventListener('click', () => {
    input.value = Math.max(1, Number(input.value) || 1) + 1;
    syncQty();
  });
  stepper.querySelector('[data-qty-decrease]').addEventListener('click', () => {
    input.value = Math.max(1, Number(input.value) || 1) - 1;
    syncQty();
  });
  input.addEventListener('input', syncQty);
  syncQty();
};

const setupReviewForm = (productId) => {
  const form = document.querySelector('[data-review-form]');
  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const note = form.querySelector('[data-review-note]');
    const submitButton = form.querySelector('button[type="submit"]');
    const nombre = form.querySelector('[data-review-name]').value.trim();
    const calificacion = Number(form.querySelector('[data-review-rating]').value);
    const comentario = form.querySelector('[data-review-comment]').value.trim();

    if (!nombre || !comentario) return;

    submitButton.disabled = true;
    try {
      await submitReview({ productId, nombre, calificacion, comentario });
      form.reset();
      note.textContent = 'Gracias por tu reseña. Quedará publicada en cuanto sea revisada.';
    } catch (error) {
      console.error('No se pudo enviar la reseña:', error);
      note.textContent = 'No pudimos enviar tu reseña. Intenta nuevamente en unos minutos.';
    } finally {
      submitButton.disabled = false;
    }
  });
};
