import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  console.error('Falta configurar VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY (.env).');
}

// Si faltan las variables, se crea el cliente con una URL válida mínima en vez de
// dejar que createClient lance una excepción al cargar el módulo: así páginas que no
// dependen de Supabase (Nosotros, Contacto) siguen renderizando en vez de romperse por completo.
export const supabase = createClient(url || 'https://misconfigured.supabase.co', anonKey || 'misconfigured');
