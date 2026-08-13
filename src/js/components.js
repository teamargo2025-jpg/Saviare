import { formatPrice } from './data.js';
import { getLogoImage } from './assets.js';

const navItems = [
  { label: 'Inicio', href: 'index.html', page: 'home' },
  { label: 'Catálogo', href: 'catalogo.html', page: 'catalogo' },
  { label: 'Nosotros', href: 'nosotros.html', page: 'nosotros' },
  { label: 'Contacto', href: 'contacto.html', page: 'contacto' }
];

export const icon = (name) => {
  const paths = {
    leaf: '<path d="M5 21c8-2 14-8 16-16C12 7 6 13 5 21Z"/><path d="M5 21c3-5 7-9 13-13"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    filter: '<path d="M4 6h16M7 12h10M10 18h4"/>',
    arrow: '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>',
    message: '<path d="M21 11.5a8.4 8.4 0 0 1-12.3 7.4L3 20.5l1.7-5.4A8.4 8.4 0 1 1 21 11.5Z"/>',
    mail: '<path d="M4 6h16v12H4z"/><path d="m4 7 8 6 8-6"/>',
    heart: '<path d="M20.8 8.4c0 5.2-8.8 10.6-8.8 10.6S3.2 13.6 3.2 8.4A4.6 4.6 0 0 1 12 6.5a4.6 4.6 0 0 1 8.8 1.9Z"/>',
    spark: '<path d="M12 2 9.7 8.8 3 11l6.7 2.2L12 20l2.3-6.8L21 11l-6.7-2.2Z"/>',
    instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r="0.6" fill="currentColor" stroke="none"/>',
    facebook: '<path d="M14 21v-8h2.8l.4-3.2H14V7.7c0-.93.26-1.56 1.6-1.56H17.3V3.28C17 3.24 16 3.15 14.83 3.15c-2.42 0-4.08 1.48-4.08 4.2V9.8H8v3.2h2.75V21Z"/>',
    tiktok: '<path d="M15 3c.4 2.2 1.8 3.6 4 3.9v2.9c-1.4 0-2.8-.4-4-1.2v6.5a5.6 5.6 0 1 1-5.6-5.6c.3 0 .6 0 .9.1v2.9a2.7 2.7 0 1 0 1.9 2.6V3Z"/>',
    star: '<path d="M12 3.5 14.5 9l6 .8-4.4 4.1 1.1 6-5.2-2.9-5.2 2.9 1.1-6-4.4-4.1 6-.8Z"/>',
    cart: '<path d="M4 4h2l1.6 10.6a2 2 0 0 0 2 1.7h7.6a2 2 0 0 0 2-1.6L20.5 8H7"/><circle cx="9.5" cy="20" r="1.3" fill="currentColor" stroke="none"/><circle cx="17.5" cy="20" r="1.3" fill="currentColor" stroke="none"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    toothbrush: '<path d="M3 21 12 12"/><ellipse cx="16" cy="8" rx="5" ry="2.4" transform="rotate(-45 16 8)"/>',
    soap: '<rect x="3" y="8" width="18" height="10" rx="4"/>',
    incense: '<path d="M12 22V10"/><path d="M9 8c0-2 1.4-2 1.4-4S9 2 9 2"/><path d="M15 8c0-2-1.4-2-1.4-4S15 2 15 2"/>',
    capsule: '<rect x="3" y="9" width="18" height="6" rx="3"/><path d="M12 9v6"/>',
    root: '<path d="M12 3v6"/><path d="M12 9c-3 0-5 3-5 7 0 3 2 5 5 5s5-2 5-5c0-4-2-7-5-7Z"/>',
    droplet: '<path d="M12 3c4 5 7 8.5 7 12a7 7 0 1 1-14 0c0-3.5 3-7 7-12Z"/>',
    eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
    'eye-off': '<path d="M2 12s4-7 10-7c1.7 0 3.2.4 4.5 1M22 12s-4 7-10 7c-1.7 0-3.2-.4-4.5-1"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/><path d="M2 2l20 20"/>'
  };

  return `<svg class="icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${paths[name] || paths.leaf}</svg>`;
};

export const navbar = (config, activePage) => `
  <header class="site-header" data-header>
    <a class="brand" href="index.html" aria-label="${config.empresa}">
      ${brandVisual(config)}
    </a>
    <div class="header-actions">
      <nav class="site-nav" data-site-nav aria-label="Navegación principal">
        ${navItems.map((item) => `<a href="${item.href}" class="${activePage === item.page ? 'active' : ''}">${item.label}</a>`).join('')}
      </nav>
      <button class="cart-toggle" type="button" data-cart-toggle aria-label="Ver carrito">
        ${icon('cart')}<span class="cart-count" data-cart-count hidden>0</span>
      </button>
      <button class="nav-toggle" type="button" data-nav-toggle aria-label="Abrir menú">${icon('menu')}</button>
    </div>
  </header>
`;

export const footer = (config) => `
  <footer class="footer">
    <div>
      <a class="brand footer-brand" href="index.html" aria-label="${config.empresa}">
        ${brandVisual(config)}
      </a>
      <p>${config.eslogan}</p>
    </div>
    <div class="footer-links">
      <a href="catalogo.html">Catálogo</a>
      <a href="nosotros.html">Nosotros</a>
      <a href="contacto.html">Contacto</a>
    </div>
    <div class="footer-contact">
      <span>${config.direccion}</span>
      <a href="mailto:${config.correo}">${config.correo}</a>
      <a href="${whatsappLink(config)}" target="_blank" rel="noreferrer">WhatsApp</a>
    </div>
  </footer>
`;

const brandVisual = (config) => config.logo
  ? `<img class="brand-icon" src="${getLogoImage(config.logoIcono || config.logo)}" alt="" /><span class="brand-name">${config.empresa}</span>`
  : `<span class="brand-mark">${icon('leaf')}</span><span>${config.empresa}</span>`;

export const lowStockBadge = (product) => {
  if (product.disponible === false) return '';
  if (product.stockMinimo == null || product.stock > product.stockMinimo) return '';
  return `<span class="pill pill-urgent">¡Solo quedan ${product.stock}!</span>`;
};

export const productCard = (product) => `
  <article class="product-card">
    <a class="product-media" href="producto.html?producto=${product.slug}" aria-label="Ver ${product.nombre}">
      <img src="${product.imagenPrincipal}" alt="${product.nombre}" loading="lazy" />
    </a>
    <div class="product-card-body">
      <div class="product-card-tags">
        <span class="pill">${product.categoria}</span>
        ${product.disponible === false ? '<span class="pill pill-muted">Agotado</span>' : lowStockBadge(product)}
      </div>
      <h3>${product.nombre}</h3>
      <p>${product.descripcion}</p>
      <div class="product-card-actions">
        <strong>${formatPrice(product.precio)}</strong>
        <a class="text-link" href="producto.html?producto=${product.slug}">Ver producto ${icon('arrow')}</a>
      </div>
      ${addToCartButton(product)}
    </div>
  </article>
`;

export const addToCartButton = (product, { label = 'Agregar al carrito', className = 'btn-ghost btn-block' } = {}) =>
  product.disponible === false
    ? `<span class="btn ${className}" aria-disabled="true">Agotado</span>`
    : `<button
        class="btn ${className}"
        type="button"
        data-add-cart="${product.id}"
        data-cart-nombre="${product.nombre}"
        data-cart-precio="${product.precio}"
        data-cart-imagen="${product.imagenPrincipal}"
        data-cart-slug="${product.slug}"
      >${icon('cart')} ${label}</button>`;

export const starRating = (value) => `
  <span class="star-rating" aria-label="${value} de 5 estrellas">
    ${[1, 2, 3, 4, 5].map((i) => `<span class="${i <= value ? 'star filled' : 'star'}">${icon('star')}</span>`).join('')}
  </span>
`;

export const pageShell = (config, activePage, content) => `
  ${navbar(config, activePage)}
  <main>${content}</main>
  ${footer(config)}
  ${cartDrawer()}
`;

const cartDrawer = () => `
  <div class="cart-backdrop" data-cart-backdrop></div>
  <aside class="cart-drawer" data-cart-drawer aria-label="Carrito de pedido">
    <div class="cart-drawer-header">
      <h2>Tu pedido</h2>
      <button class="cart-close" type="button" data-cart-close aria-label="Cerrar carrito">${icon('close')}</button>
    </div>
    <div class="cart-items" data-cart-items></div>
    <div class="cart-summary">
      <div class="cart-total-row"><span>Total</span><strong data-cart-total></strong></div>
      <button class="btn btn-ghost" type="button" data-cart-clear>Vaciar carrito</button>
      <a class="btn btn-primary" data-cart-whatsapp href="#" target="_blank" rel="noreferrer">${icon('message')} Pedir por WhatsApp</a>
    </div>
  </aside>
`;

export const sectionHeading = (eyebrow, title, copy = '') => `
  <div class="section-heading">
    <span>${eyebrow}</span>
    <h2>${title}</h2>
    ${copy ? `<p>${copy}</p>` : ''}
  </div>
`;

export const whatsappLink = (config, productName = '') => {
  const text = productName
    ? `Hola, estoy interesado en el producto ${productName}.`
    : `Hola, quiero recibir información sobre ${config.empresa}.`;
  return `https://wa.me/${config.whatsapp}?text=${encodeURIComponent(text)}`;
};

export const setupNavigation = () => {
  const toggle = document.querySelector('[data-nav-toggle]');
  const nav = document.querySelector('[data-site-nav]');
  const header = document.querySelector('[data-header]');

  toggle?.addEventListener('click', () => {
    nav?.classList.toggle('open');
  });

  window.addEventListener('scroll', () => {
    header?.classList.toggle('scrolled', window.scrollY > 12);
  });
};
