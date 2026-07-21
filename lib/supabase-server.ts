import "server-only";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL) throw new Error("NEXT_PUBLIC_SUPABASE_URL nao configurado");
if (!SUPABASE_SERVICE_KEY) throw new Error("SUPABASE_SERVICE_KEY nao configurado");

// Cliente admin (service role) — bypassa RLS, NUNCA expor no client
// "server-only" garante erro de build se importado em Client Component
export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
