import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim().replace(/\/$/, '');
const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();

if (supabaseUrl.includes('supabase.com') && !supabaseUrl.includes('.supabase.co')) {
    console.error('SUPABASE ERROR: Your NEXT_PUBLIC_SUPABASE_URL looks like a Dashboard URL. It must be the API URL (https://xyz.supabase.co).');
}

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase credentials missing. Image uploads will not work correctly.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
