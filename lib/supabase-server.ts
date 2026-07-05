import "server-only";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;

// Cliente admin (service role) — bypassa RLS, NUNCA expor no client
// "server-only" garante erro de build se importado em Client Component
export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
