import { supabase } from '../supabase.js';

export const ADMIN_EMAIL = 'fchoquequ@unsa.edu.pe';

export const getSession = async () => {
  const { data } = await supabase.auth.getSession();
  return data.session;
};

export const isAdminSession = (session) => session?.user?.email === ADMIN_EMAIL;

export const signIn = async (email, password) => {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
};

export const signOut = () => supabase.auth.signOut();

export const onAuthChange = (callback) => {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => callback(session));
  return data.subscription;
};
