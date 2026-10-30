import { createClient } from '@supabase/supabase-js';

const metaEnv = (typeof import.meta !== 'undefined' && (import.meta as any).env) || {};
const procEnv = typeof process !== 'undefined' ? process.env : {};

const supabaseUrl = metaEnv.VITE_SUPABASE_URL || procEnv?.VITE_SUPABASE_URL || 'https://arsfidkuebytexuzlohm.supabase.co';
const supabaseAnonKey = metaEnv.VITE_SUPABASE_ANON_KEY || procEnv?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFyc2ZpZGt1ZWJ5dGV4dXpsb2htIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMxNTg0MDIsImV4cCI6MjEwODczNDQwMn0.R-7w4j6HQE3eunm-xoBOAgBreKKXe5MenH_FEABpPAU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
