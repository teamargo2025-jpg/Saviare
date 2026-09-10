import { comprimirImagen } from '../comprimir-imagen.js';
import { supabase } from '../supabase.js';

export const listAllCategories = async () => {
  const { data, error } = await supabase.from('categorias').select('*').order('nombre');
  if (error) throw error;
  return data;
};

export const createCategory = async ({ nombre, descripcion }) => {
  const { error } = await supabase.from('categorias').insert({ nombre, descripcion });
  if (error) throw error;
};

export const updateCategory = async (id, { nombre, descripcion }) => {
  const { error } = await supabase.from('categorias').update({ nombre, descripcion }).eq('id', id);
  if (error) throw error;
};

export const deleteCategory = async (id) => {
  const { error } = await supabase.from('categorias').delete().eq('id', id);
  if (error) throw error;
};

export const listAllProducts = async () => {
  const { data, error } = await supabase
    .from('productos')
    .select('*, categorias ( id, nombre )')
    .order('nombre');
  if (error) throw error;
  return data;
};

export const createProduct = async (payload) => {
  const { error } = await supabase.from('productos').insert(payload);
  if (error) throw error;
};

export const updateProduct = async (id, payload) => {
  const { error } = await supabase.from('productos').update(payload).eq('id', id);
  if (error) throw error;
};

export const deleteProduct = async (id) => {
  const { error } = await supabase.from('productos').delete().eq('id', id);
  if (error) throw error;
};

export const uploadProductImage = async (file, slug) => {
  // Se comprime acá y no en la vista para que ninguna pantalla futura
  // pueda saltearse el paso y volver a llenar el Storage.
  const liviano = await comprimirImagen(file);
  const path = `${slug}/${Date.now()}-${liviano.name}`;
  const { error } = await supabase.storage.from('productos').upload(path, liviano);
  if (error) throw error;
  return supabase.storage.from('productos').getPublicUrl(path).data.publicUrl;
};

export const listAllReviews = async () => {
  const { data, error } = await supabase
    .from('resenas')
    .select('*, productos ( nombre )')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
};

export const setReviewStatus = async (id, estado) => {
  const { error } = await supabase.from('resenas').update({ estado }).eq('id', id);
  if (error) throw error;
};

export const deleteReview = async (id) => {
  const { error } = await supabase.from('resenas').delete().eq('id', id);
  if (error) throw error;
};

export const listAllPedidos = async () => {
  const { data, error } = await supabase
    .from('pedidos')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
};

// Descuenta el stock de cada item — compartido por confirmPedido y
// recordDirectSale para que no se desincronicen entre si.
//
// La resta la hace Postgres en una sola sentencia (funcion
// descontar_stock). Antes se leia el stock aca y se escribia el
// resultado ya calculado, asi que dos ventas simultaneas se pisaban
// entre si y se vendia stock que no existia.
const decrementStock = async (items) => {
  const aDescontar = items
    .filter((item) => item.producto_id && item.cantidad > 0)
    .map((item) => ({ producto_id: item.producto_id, cantidad: item.cantidad }));
  if (!aDescontar.length) return;

  const { error } = await supabase.rpc('descontar_stock', { p_items: aDescontar });
  if (error) throw error;
};

export const confirmPedido = async (pedido) => {
  await decrementStock(pedido.items ?? []);

  const { error: updateError } = await supabase
    .from('pedidos')
    .update({ estado: 'confirmado' })
    .eq('id', pedido.id);
  if (updateError) throw updateError;
};

export const cancelPedido = async (id) => {
  const { error } = await supabase.from('pedidos').update({ estado: 'cancelado' }).eq('id', id);
  if (error) throw error;
};

export const recordDirectSale = async ({ items, total }) => {
  await decrementStock(items);

  const { error: insertError } = await supabase.from('pedidos').insert({
    items,
    total,
    estado: 'confirmado',
    origen: 'qr'
  });
  if (insertError) throw insertError;
};

export const uploadComprobante = async (file, pedidoId) => {
  // El comprobante es una captura de Yape: tiene que quedar legible,
  // así que se comprime con más calidad que una foto de producto.
  const liviano = await comprimirImagen(file, { maxLado: 1400, calidad: 0.9 });
  const path = `${pedidoId}/${Date.now()}-${liviano.name}`;
  const { error } = await supabase.storage.from('comprobantes').upload(path, liviano);
  if (error) throw error;

  const { error: updateError } = await supabase
    .from('pedidos')
    .update({ comprobante_url: path })
    .eq('id', pedidoId);
  if (updateError) throw updateError;

  return path;
};

export const getComprobanteUrl = async (path) => {
  const { data, error } = await supabase.storage
    .from('comprobantes')
    .createSignedUrl(path, 60 * 10);
  if (error) throw error;
  return data.signedUrl;
};
