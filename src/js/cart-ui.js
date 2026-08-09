import { addToCart, clearCart, getCartItems, getCartTotal, removeFromCart, setCartQuantity, subscribeToCart } from './cart.js';
import { formatPrice, recordOrder } from './data.js';
import { icon } from './components.js';

const buildCartMessage = (config, items) => {
  const lines = items.map((item) => `• ${item.cantidad}x ${item.nombre} (${formatPrice(item.precio)} c/u)`);
  return [
    `Hola, quiero hacer un pedido en ${config.empresa}:`,
    '',
    ...lines,
    '',
    `Total: ${formatPrice(getCartTotal())}`
  ].join('\n');
};

const itemRow = (item) => `
  <article class="cart-item">
    <img src="${item.imagen}" alt="${item.nombre}" />
    <div class="cart-item-body">
      <strong>${item.nombre}</strong>
      <span>${formatPrice(item.precio)}</span>
      <div class="cart-qty">
        <button type="button" data-cart-decrease="${item.id}" aria-label="Quitar una unidad">${icon('minus')}</button>
        <span>${item.cantidad}</span>
        <button type="button" data-cart-increase="${item.id}" aria-label="Agregar una unidad">${icon('plus')}</button>
      </div>
    </div>
    <button class="cart-item-remove" type="button" data-cart-remove="${item.id}" aria-label="Quitar del carrito">${icon('close')}</button>
  </article>
`;

export const setupCart = (config) => {
  const toggle = document.querySelector('[data-cart-toggle]');
  const drawer = document.querySelector('[data-cart-drawer]');
  const backdrop = document.querySelector('[data-cart-backdrop]');
  const closeBtn = document.querySelector('[data-cart-close]');
  const itemsBox = document.querySelector('[data-cart-items]');
  const countBadge = document.querySelector('[data-cart-count]');
  const totalEl = document.querySelector('[data-cart-total]');
  const whatsappBtn = document.querySelector('[data-cart-whatsapp]');
  const clearBtn = document.querySelector('[data-cart-clear]');

  if (!toggle || !drawer) return;

  const openDrawer = () => {
    drawer.classList.add('open');
    backdrop.classList.add('open');
  };

  const closeDrawer = () => {
    drawer.classList.remove('open');
    backdrop.classList.remove('open');
  };

  const paint = () => {
    const items = getCartItems();
    const count = items.reduce((sum, item) => sum + item.cantidad, 0);
    countBadge.textContent = count;
    countBadge.hidden = count === 0;

    itemsBox.innerHTML = items.length
      ? items.map(itemRow).join('')
      : '<p class="empty-state">Tu carrito está vacío.</p>';

    totalEl.textContent = formatPrice(getCartTotal());
    clearBtn.disabled = items.length === 0;

    whatsappBtn.href = items.length
      ? `https://wa.me/${config.whatsapp}?text=${encodeURIComponent(buildCartMessage(config, items))}`
      : '#';
    whatsappBtn.classList.toggle('is-disabled', items.length === 0);
    if (items.length === 0) whatsappBtn.setAttribute('aria-disabled', 'true');
    else whatsappBtn.removeAttribute('aria-disabled');

    itemsBox.querySelectorAll('[data-cart-increase]').forEach((button) => {
      button.addEventListener('click', () => {
        const item = items.find((entry) => entry.id === button.dataset.cartIncrease);
        setCartQuantity(item.id, item.cantidad + 1);
      });
    });
    itemsBox.querySelectorAll('[data-cart-decrease]').forEach((button) => {
      button.addEventListener('click', () => {
        const item = items.find((entry) => entry.id === button.dataset.cartDecrease);
        setCartQuantity(item.id, item.cantidad - 1);
      });
    });
    itemsBox.querySelectorAll('[data-cart-remove]').forEach((button) => {
      button.addEventListener('click', () => removeFromCart(button.dataset.cartRemove));
    });
  };

  toggle.addEventListener('click', () => {
    paint();
    openDrawer();
  });
  closeBtn.addEventListener('click', closeDrawer);
  backdrop.addEventListener('click', closeDrawer);
  clearBtn.addEventListener('click', () => clearCart());
  whatsappBtn.addEventListener('click', (event) => {
    if (whatsappBtn.getAttribute('aria-disabled') === 'true') {
      event.preventDefault();
      return;
    }

    const items = getCartItems();
    recordOrder({
      items: items.map((item) => ({
        producto_id: item.id,
        slug: item.slug,
        nombre: item.nombre,
        precio: item.precio,
        cantidad: item.cantidad
      })),
      total: getCartTotal()
    }).catch((error) => console.error('No se pudo registrar el pedido:', error));
  });

  document.body.addEventListener('click', (event) => {
    const button = event.target.closest('[data-add-cart]');
    if (!button) return;
    addToCart({
      id: button.dataset.addCart,
      nombre: button.dataset.cartNombre,
      precio: Number(button.dataset.cartPrecio),
      imagen: button.dataset.cartImagen,
      slug: button.dataset.cartSlug
    }, Number(button.dataset.cartQty || 1));
    paint();
    openDrawer();
  });

  subscribeToCart(() => paint());
  paint();
};
