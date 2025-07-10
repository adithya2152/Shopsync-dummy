import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const adminkey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE!;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase URL and Key are required');
}

// Client-side supabase instance
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Admin supabase instance
const admin_supabase = createClient(supabaseUrl, adminkey);

export { supabase, admin_supabase };