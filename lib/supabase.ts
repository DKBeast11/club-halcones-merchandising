import { createClient } from '@supabase/supabase-js'

// Valores por defecto para desarrollo
const DEFAULT_SUPABASE_URL = 'https://abvziolumaqmacbfweci.supabase.co'
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFidnppb2x1bWFxbWFjYmZ3ZWNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxMzc3MjQsImV4cCI6MjA3MzcxMzcyNH0.PuVRdPfqX0B9fH-pF3Y2V8FT7eAZYyV9vNxmofZr8Fk'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY


console.log('Supabase URL:', supabaseUrl)
console.log('Supabase Anon Key:', supabaseAnonKey ? 'Present' : 'Missing')

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Prueba de conexión: obtener el número de productos
if (typeof window !== 'undefined') {
  supabase.from('products').select('id', { count: 'exact', head: true })
    .then(({ count, error }) => {
      if (error) {
        console.error('Error de conexión a Supabase:', error.message);
      } else {
        console.log('Conexión a Supabase exitosa. Número de productos:', count);
      }
    });
}

// (Eliminado: declaración duplicada)

// Cliente con service role para operaciones del servidor
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
export const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null
