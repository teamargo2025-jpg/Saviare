import configuracion from '../data/configuracion.json';
import { supabase } from './supabase.js';

const PRODUCT_COLUMNS = '*, categorias ( nombre )';

const mapProduct = (row) => ({
  id: row.id,
  nombre: row.nombre,
  slug: row.slug,
  categoria: row.categorias?.nombre ?? '',
  precio: row.precio,
  descripcion: row.descripcion,
  beneficios: row.beneficios ?? [],
  ingredientes: row.ingredientes ?? [],
  modoUso: row.modo_uso,
  imagenPrincipal: row.imagen_principal,
  imagenes: row.imagenes ?? [],
  destacado: row.destacado,
  activo: row.activo,
  stock: row.stock,
  disponible: row.stock > 0
});

export const getConfig = () => configuracion;

export const getCategories = async () => {
  const { data, error } = await supabase.from('categorias').select('*').order('nombre');
  if (error) throw error;
  return data;
};

export const getProducts = async () => {
  const { data, error } = await supabase
    .from('productos')
    .select(PRODUCT_COLUMNS)
    .eq('activo', true)
    .order('nombre');
  if (error) throw error;
  return data.map(mapProduct);
};

export const getFeaturedProducts = async () => {
  const products = await getProducts();
  return products.filter((product) => product.destacado);
};

export const getProductBySlug = async (slug) => {
  const { data, error } = await supabase
    .from('productos')
    .select(PRODUCT_COLUMNS)
    .eq('slug', slug)
    .eq('activo', true)
    .maybeSingle();
  if (error) throw error;
  return data ? mapProduct(data) : null;
};

export const getApprovedReviews = async (productId) => {
  const { data, error } = await supabase
    .from('resenas')
    .select('*')
    .eq('producto_id', productId)
    .eq('estado', 'aprobada')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
};

export const submitReview = async ({ productId, nombre, calificacion, comentario }) => {
  const { error } = await supabase.from('resenas').insert({
    producto_id: productId,
    nombre_cliente: nombre,
    calificacion,
    comentario
  });
  if (error) throw error;
};

export const recordOrder = async ({ items, total }) => {
  const { error } = await supabase.from('pedidos').insert({ items, total });
  if (error) throw error;
};

export const formatPrice = (value) =>
  new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(value);
