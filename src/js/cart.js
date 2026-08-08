const STORAGE_KEY = 'saviare-carrito';
const listeners = new Set();

const readCart = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const writeCart = (items) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  listeners.forEach((listener) => listener(items));
};

export const getCartItems = () => readCart();

export const subscribeToCart = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const addToCart = (product, cantidad = 1) => {
  const items = readCart();
  const existing = items.find((item) => item.id === product.id);
  if (existing) {
    existing.cantidad += cantidad;
  } else {
    items.push({
      id: product.id,
      nombre: product.nombre,
      precio: product.precio,
      imagen: product.imagen,
      slug: product.slug,
      cantidad
    });
  }
  writeCart(items);
};

export const setCartQuantity = (id, cantidad) => {
  const items = readCart();
  const item = items.find((entry) => entry.id === id);
  if (!item) return;
  if (cantidad <= 0) {
    writeCart(items.filter((entry) => entry.id !== id));
  } else {
    item.cantidad = cantidad;
    writeCart(items);
  }
};

export const removeFromCart = (id) => writeCart(readCart().filter((item) => item.id !== id));

export const clearCart = () => writeCart([]);

export const getCartCount = () => readCart().reduce((sum, item) => sum + item.cantidad, 0);

export const getCartTotal = () => readCart().reduce((sum, item) => sum + item.cantidad * item.precio, 0);
