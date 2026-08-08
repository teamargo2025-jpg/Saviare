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
