import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (supabaseAnonKey && supabaseAnonKey.startsWith('sb_publishable_')) {
  console.warn('CRITICAL CONFIG ERROR: Your VITE_SUPABASE_ANON_KEY looks like a Stripe publishable key! Please replace it with your Supabase Anon Key from the Supabase Dashboard.');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
);
