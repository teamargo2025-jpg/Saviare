import { formatPrice } from './data.js';
import { getLogoImage, getProductImage } from './assets.js';

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
    spark: '<path d="M12 2 9.7 8.8 3 11l6.7 2.2L12 20l2.3-6.8L21 11l-6.7-2.2Z"/>'
  };

  return `<svg class="icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${paths[name] || paths.leaf}</svg>`;
};

export const navbar = (config, activePage) => `
  <header class="site-header" data-header>
    <a class="brand" href="index.html" aria-label="${config.empresa}">
      ${brandVisual(config)}
    </a>
    <button class="nav-toggle" type="button" data-nav-toggle aria-label="Abrir menú">${icon('menu')}</button>
    <nav class="site-nav" data-site-nav aria-label="Navegación principal">
      ${navItems.map((item) => `<a href="${item.href}" class="${activePage === item.page ? 'active' : ''}">${item.label}</a>`).join('')}
    </nav>
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

export const productCard = (product) => `
  <article class="product-card">
    <a class="product-media" href="producto.html?producto=${product.slug}" aria-label="Ver ${product.nombre}">
      <img src="${getProductImage(product.imagenPrincipal)}" alt="${product.nombre}" loading="lazy" />
    </a>
    <div class="product-card-body">
      <span class="pill">${product.categoria}</span>
      <h3>${product.nombre}</h3>
      <p>${product.descripcion}</p>
      <div class="product-card-actions">
        <strong>${formatPrice(product.precio)}</strong>
        <a class="text-link" href="producto.html?producto=${product.slug}">Ver producto ${icon('arrow')}</a>
      </div>
    </div>
  </article>
`;

export const pageShell = (config, activePage, content) => `
  ${navbar(config, activePage)}
  <main>${content}</main>
  ${footer(config)}
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
