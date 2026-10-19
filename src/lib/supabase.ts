import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fysedfboppqdaizrgonb.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseAnonKey !== 'your_supabase_anon_key_here' && 
  supabaseAnonKey.length > 20
);

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey || 'dummy-key-to-prevent-crash-if-empty',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);
