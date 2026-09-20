/**
 * Script M03 — migrar credenciais EFI e Meta para colunas _enc (AES-256-GCM)
 * Uso: npx tsx --env-file=.env.local scripts/m03-migrar-credenciais.ts
 * Idempotente: só migra linhas onde _enc é null mas plaintext tem valor.
 */

import { createClient } from "@supabase/supabase-js";
import { encrypt } from "../lib/crypto";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

async function migrarAssociacoes() {
  const { data, error } = await supabase
    .from("associacoes")
    .select(
      "id, efi_client_id, efi_client_secret, efi_pix_key, efi_certificate_base64, efi_client_id_enc, efi_client_secret_enc, efi_pix_key_enc, efi_certificate_base64_enc"
    )
    .or(
      "efi_client_id_enc.is.null,efi_client_secret_enc.is.null,efi_pix_key_enc.is.null,efi_certificate_base64_enc.is.null"
    );

  if (error) { console.error("Erro ao buscar associacoes:", error.message); return; }
  if (!data?.length) { console.log("associacoes: nenhuma linha para migrar"); return; }

  let migradas = 0;
  for (const row of data) {
    const update: Record<string, string | null> = {};
    if (row.efi_client_id && !row.efi_client_id_enc)
      update.efi_client_id_enc = encrypt(row.efi_client_id);
    if (row.efi_client_secret && !row.efi_client_secret_enc)
      update.efi_client_secret_enc = encrypt(row.efi_client_secret);
    if (row.efi_pix_key && !row.efi_pix_key_enc)
      update.efi_pix_key_enc = encrypt(row.efi_pix_key);
    if (row.efi_certificate_base64 && !row.efi_certificate_base64_enc)
      update.efi_certificate_base64_enc = encrypt(row.efi_certificate_base64);

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
    const update: Record<string, string | null> = {};
    if (row.meta_access_token && !row.meta_access_token_enc)
      update.meta_access_token_enc = encrypt(row.meta_access_token);
    if (row.openai_api_key && !row.openai_api_key_enc)
      update.openai_api_key_enc = encrypt(row.openai_api_key);

    if (Object.keys(update).length === 0) continue;

    const { error: ue } = await supabase.from("trafego_contas").update(update).eq("id", row.id);
    if (ue) { console.error(`Erro ao atualizar trafego_contas ${row.id}:`, ue.message); continue; }
    migradas++;
  }
  console.log(`trafego_contas: ${migradas} linha(s) migrada(s)`);
}

async function main() {
  console.log("=== M03 — migração de credenciais para _enc ===");
  await migrarAssociacoes();
  await migrarTrafegoContas();
  console.log("=== Concluído ===");
}

main().catch((e) => { console.error(e); process.exit(1); });
