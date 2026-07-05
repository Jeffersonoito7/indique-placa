import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Cliente publico (anon key) — pode ser usado em Client Components
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
