import productos from '../data/productos.json';
import categorias from '../data/categorias.json';
import configuracion from '../data/configuracion.json';

export const getConfig = () => configuracion;
export const getCategories = () => categorias;
export const getProducts = () => productos.filter((product) => product.activo);
export const getFeaturedProducts = () => getProducts().filter((product) => product.destacado);
export const getProductBySlug = (slug) => getProducts().find((product) => product.slug === slug);
export const formatPrice = (value) =>
  new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(value);
