import { createClient } from '@supabase/supabase-js';

// Primary env (Vite)
let supabaseUrl = import.meta?.env?.VITE_SUPABASE_URL || '';
let supabaseAnonKey = import.meta?.env?.VITE_SUPABASE_ANON_KEY || '';

// Secondary: window globals (can set before app mounts)
if((!supabaseUrl || !supabaseAnonKey) && typeof window !== 'undefined'){
  supabaseUrl = window.__SUPABASE_URL__ || supabaseUrl;
  supabaseAnonKey = window.__SUPABASE_ANON_KEY__ || supabaseAnonKey;
}

// Allow explicit hard constants (last resort – developer can paste directly here if needed)
const HARD_URL = 'https://lfnhvsigfcaimgiwbeyb.supabase.co';
const HARD_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxmbmh2c2lnZmNhaW1naXdiZXliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MTIyMzYsImV4cCI6MjA3NDk4ODIzNn0.KE6y53oscvkoqmzqGnLHpsI3j5fu3M7w-vLpegHLcj4';
if((!supabaseUrl || !supabaseAnonKey) && (HARD_URL && HARD_KEY)){
  supabaseUrl = HARD_URL; supabaseAnonKey = HARD_KEY;
}

// Tertiary: localStorage (developer manual override) using fixed keys
try {
  if((!supabaseUrl || !supabaseAnonKey) && typeof localStorage !== 'undefined'){
    const lsUrl = localStorage.getItem('DEV_SUPABASE_URL');
    const lsKey = localStorage.getItem('DEV_SUPABASE_ANON_KEY');
    if(lsUrl) supabaseUrl = lsUrl;
    if(lsKey) supabaseAnonKey = lsKey;
  }
} catch {}

// Normalize (trim)
if(typeof supabaseUrl === 'string') supabaseUrl = supabaseUrl.trim();
if(typeof supabaseAnonKey === 'string') supabaseAnonKey = supabaseAnonKey.trim();

// Diagnostics (only once)
if(typeof window !== 'undefined' && !window.__SUPA_DEBUG__){
  window.__SUPA_DEBUG__ = true;
  // eslint-disable-next-line no-console
  console.debug('[supabase:diagnostic]', {
    hasEnvUrl: !!import.meta?.env?.VITE_SUPABASE_URL,
    hasEnvKey: !!import.meta?.env?.VITE_SUPABASE_ANON_KEY,
    finalUrlLength: supabaseUrl?.length||0,
    finalKeyLength: supabaseAnonKey?.length||0
  });
}

let supabase;

if(!supabaseUrl || !supabaseAnonKey){
  const msg = '[supabase] Missing config – reason: ' + (
    !supabaseUrl && !supabaseAnonKey ? 'both url & key empty' : (!supabaseUrl ? 'url empty' : 'anon key empty')
  ) + ' (using stub fallback).';
  // eslint-disable-next-line no-console
  console.warn(msg);
  // Provide a lightweight stub so calls fail gracefully
  const errorFn = () => ({ data: null, error: new Error('Supabase not configured: add VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY to your .env') });
  const chain = () => ({
    select(){ return chain(); },
    insert(){ return Promise.resolve(errorFn()); },
    update(){ return Promise.resolve(errorFn()); },
    delete(){ return Promise.resolve(errorFn()); },
    upsert(){ return Promise.resolve(errorFn()); },
    order(){ return chain(); },
    limit(){ return chain(); },
    eq(){ return chain(); },
    in(){ return chain(); },
    single(){ return Promise.resolve(errorFn()); },
    then(res, rej){ // allow await on chain without breaking
      const { data, error } = errorFn();
      return Promise.resolve({ data, error }).then(res, rej);
    }
  });
  supabase = {
    from(){ return chain(); },
    auth: {
      getSession: async () => ({ data:{ session:null }, error:null }),
      signInWithPassword: async () => errorFn(),
      signOut: async () => errorFn(),
      signUp: async () => errorFn()
    },
    storage: { from(){ return { upload: async () => errorFn(), getPublicUrl(){ return { data:{ publicUrl:'' } }; } }; } }
  };
} else {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });
}

export { supabase };
