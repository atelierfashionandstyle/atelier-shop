import { createClient } from 'https://esm.sh/@supabase/supabase-js'

const supabaseUrl = 'https://ittsskhqkcbeuwuasjxf.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dHNza2hxa2NiZXV3dWFzanhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMzkyMzYsImV4cCI6MjA4ODgxNTIzNn0.PD82j5owKbIMZS2YchFqrqQPyppbFNYkE12PhD-Wibw'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
