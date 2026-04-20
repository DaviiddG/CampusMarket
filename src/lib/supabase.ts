import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Configuración de Supabase incompleta. Verifica tus variables de entorno VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.');
    throw new Error('Supabase Url or Anon Key is missing!');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
