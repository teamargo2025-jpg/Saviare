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
  const path = `${slug}/${Date.now()}-${file.name}`;
  const { error } = await supabase.storage.from('productos').upload(path, file);
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

export const confirmPedido = async (pedido) => {
  const items = pedido.items ?? [];
  const productIds = items.map((item) => item.producto_id).filter(Boolean);

  if (productIds.length) {
    const { data: productos, error: fetchError } = await supabase
      .from('productos')
      .select('id, stock')
      .in('id', productIds);
    if (fetchError) throw fetchError;

    const stockById = new Map(productos.map((producto) => [producto.id, producto.stock]));

    for (const item of items) {
      if (!item.producto_id || !stockById.has(item.producto_id)) continue;
      const nuevoStock = Math.max(0, stockById.get(item.producto_id) - item.cantidad);
      const { error } = await supabase
        .from('productos')
        .update({ stock: nuevoStock })
        .eq('id', item.producto_id);
      if (error) throw error;
    }
  }

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
  const productIds = items.map((item) => item.producto_id);

  const { data: productos, error: fetchError } = await supabase
    .from('productos')
    .select('id, stock')
    .in('id', productIds);
  if (fetchError) throw fetchError;

  const stockById = new Map(productos.map((producto) => [producto.id, producto.stock]));

  for (const item of items) {
    if (!stockById.has(item.producto_id)) continue;
    const nuevoStock = Math.max(0, stockById.get(item.producto_id) - item.cantidad);
    const { error } = await supabase
      .from('productos')
      .update({ stock: nuevoStock })
      .eq('id', item.producto_id);
    if (error) throw error;
  }

  const { error: insertError } = await supabase.from('pedidos').insert({
    items,
    total,
    estado: 'confirmado',
    origen: 'qr'
  });
  if (insertError) throw insertError;
};

export const uploadComprobante = async (file, pedidoId) => {
  const path = `${pedidoId}/${Date.now()}-${file.name}`;
  const { error } = await supabase.storage.from('comprobantes').upload(path, file);
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
