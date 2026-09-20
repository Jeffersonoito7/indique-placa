// Script M03 standalone — sem server-only, roda direto com node
// Uso: node --env-file=.env.local scripts/m03-run.mjs
import { createClient } from "@supabase/supabase-js";
import { createCipheriv, randomBytes } from "crypto";

function getKey() {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw) throw new Error("ENCRYPTION_KEY não configurada");
  const buf = Buffer.from(raw, "hex");
  if (buf.length !== 32) throw new Error("ENCRYPTION_KEY deve ter 32 bytes (64 hex chars)");
  return buf;
}

function encrypt(plaintext) {
  const key = getKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function migrarAssociacoes() {
  const { data, error } = await supabase
    .from("associacoes")
    .select("id, efi_client_id, efi_client_secret, efi_pix_key, efi_certificate_base64, efi_client_id_enc, efi_client_secret_enc, efi_pix_key_enc, efi_certificate_base64_enc")
    .or("efi_client_id_enc.is.null,efi_client_secret_enc.is.null,efi_pix_key_enc.is.null,efi_certificate_base64_enc.is.null");

  if (error) { console.error("Erro ao buscar associacoes:", error.message); return; }
  if (!data?.length) { console.log("associacoes: nenhuma linha para migrar"); return; }

  let migradas = 0;
  for (const row of data) {
    const update = {};
    if (row.efi_client_id && !row.efi_client_id_enc) update.efi_client_id_enc = encrypt(row.efi_client_id);
    if (row.efi_client_secret && !row.efi_client_secret_enc) update.efi_client_secret_enc = encrypt(row.efi_client_secret);
    if (row.efi_pix_key && !row.efi_pix_key_enc) update.efi_pix_key_enc = encrypt(row.efi_pix_key);
    if (row.efi_certificate_base64 && !row.efi_certificate_base64_enc) update.efi_certificate_base64_enc = encrypt(row.efi_certificate_base64);
    if (Object.keys(update).length === 0) continue;
    const { error: ue } = await supabase.from("associacoes").update(update).eq("id", row.id);
    if (ue) { console.error(`Erro ao atualizar associacao ${row.id}:`, ue.message); continue; }
    migradas++;
  }
  console.log(`associacoes: ${migradas} linha(s) migrada(s)`);
}

async function migrarTrafegoContas() {
  const { data, error } = await supabase
    .from("trafego_contas")
    .select("id, meta_access_token, openai_api_key, meta_access_token_enc, openai_api_key_enc")
    .or("meta_access_token_enc.is.null,openai_api_key_enc.is.null");

  if (error) { console.error("Erro ao buscar trafego_contas:", error.message); return; }
  if (!data?.length) { console.log("trafego_contas: nenhuma linha para migrar"); return; }

  let migradas = 0;
  for (const row of data) {
    const update = {};
    if (row.meta_access_token && !row.meta_access_token_enc) update.meta_access_token_enc = encrypt(row.meta_access_token);
    if (row.openai_api_key && !row.openai_api_key_enc) update.openai_api_key_enc = encrypt(row.openai_api_key);
    if (Object.keys(update).length === 0) continue;
    const { error: ue } = await supabase.from("trafego_contas").update(update).eq("id", row.id);
    if (ue) { console.error(`Erro ao atualizar trafego_contas ${row.id}:`, ue.message); continue; }
    migradas++;
  }
  console.log(`trafego_contas: ${migradas} linha(s) migrada(s)`);
}

console.log("=== M03 — migração de credenciais para _enc ===");
await migrarAssociacoes();
await migrarTrafegoContas();
console.log("=== Concluído ===");
