/**
 * Script de reenvio de notificacoes WhatsApp para indicacoes recentes.
 * Execucao: node --experimental-strip-types --env-file=.env.local scripts/reenviar-notificacoes.ts
 *
 * Nota: nao importa supabase-server.ts nem whatsapp.ts diretamente para evitar
 * dependencias do runtime Next.js (server-only, etc). Logica equivalente inline.
 */

import { createClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Configuracao
// ---------------------------------------------------------------------------

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;
const EVOLUTION_BASE_URL = process.env.EVOLUTION_API_URL;
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY;
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE;
const DIAS = 7;

// ---------------------------------------------------------------------------
// Validacoes iniciais
// ---------------------------------------------------------------------------

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("[FATAL] NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_KEY nao definidos.");
  process.exit(1);
}

const whatsappHabilitado = Boolean(EVOLUTION_BASE_URL && EVOLUTION_API_KEY && EVOLUTION_INSTANCE);

if (!whatsappHabilitado) {
  console.warn("");
  console.warn("[AVISO] Variaveis da Evolution API ausentes no .env.local:");
  console.warn("  EVOLUTION_API_URL  = " + (EVOLUTION_BASE_URL ?? "(nao definido)"));
  console.warn("  EVOLUTION_API_KEY  = " + (EVOLUTION_API_KEY  ? "***" : "(nao definido)"));
  console.warn("  EVOLUTION_INSTANCE = " + (EVOLUTION_INSTANCE ?? "(nao definido)"));
  console.warn("  O script vai LISTAR as indicacoes, mas NAO enviara mensagens.");
  console.warn("  Adicione as variaveis ao .env.local e execute novamente.");
  console.warn("");
}

// ---------------------------------------------------------------------------
// Cliente Supabase (service role — bypassa RLS)
// ---------------------------------------------------------------------------

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ---------------------------------------------------------------------------
// Envio de mensagem via Evolution API (espelha lib/whatsapp.ts)
// ---------------------------------------------------------------------------

async function enviarWhatsApp(telefone: string, mensagem: string): Promise<boolean> {
  if (!whatsappHabilitado) return false;

  const numero = telefone.replace(/\D/g, "");
  const numeroFormatado = numero.startsWith("55") ? numero : `55${numero}`;

  try {
    const resp = await fetch(`${EVOLUTION_BASE_URL}/message/sendText/${EVOLUTION_INSTANCE}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: EVOLUTION_API_KEY!,
      },
      body: JSON.stringify({ number: numeroFormatado, text: mensagem }),
    });
    if (!resp.ok) {
      const body = await resp.text().catch(() => "");
      console.error(`  -> Evolution API HTTP ${resp.status}: ${body.slice(0, 200)}`);
    }
    return resp.ok;
  } catch (err) {
    console.error(`  -> Excecao ao chamar Evolution API: ${err}`);
    return false;
  }
}

async function notificarNovoLead(opts: {
  nomeConsultor: string;
  telefoneConsultor: string;
  placa: string;
  nomeLead?: string | null;
  telefoneLead?: string | null;
  viaIndicador?: string | null;
}): Promise<boolean> {
  const via = opts.viaIndicador ? ` via indicador *${opts.viaIndicador}*` : "";
  const proprietario = opts.nomeLead ? `\n*Proprietário:* ${opts.nomeLead}` : "";
  const contato = opts.telefoneLead ? `\n*Telefone:* ${opts.telefoneLead}` : "";
  const msg =
    `Ola, *${opts.nomeConsultor}*!\n\n` +
    `Nova placa indicada${via}:\n\n` +
    `*Placa:* ${opts.placa}${proprietario}${contato}\n\n` +
    `Acesse o painel para acompanhar: https://app.indiqueplaca.com.br/consultor/leads`;
  return enviarWhatsApp(opts.telefoneConsultor, msg);
}

// ---------------------------------------------------------------------------
// Tipos auxiliares
// ---------------------------------------------------------------------------

interface IndicacaoRow {
  id: string;
  placa: string;
  nome_lead: string | null;
  telefone_lead: string | null;
  tipo_veiculo: string | null;
  criado_em: string;
  consultor_nome: string;
  consultor_fone: string;
  indicador_nome: string;
  indicador_telefone: string;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const dataLimite = new Date();
  dataLimite.setDate(dataLimite.getDate() - DIAS);
  const dataISO = dataLimite.toISOString();

  console.log(`Buscando indicacoes dos ultimos ${DIAS} dias (desde ${dataLimite.toLocaleDateString("pt-BR")})...\n`);

  const { data, error } = await supabase
    .from("indicacoes")
    .select(`
      id,
      placa,
      nome_lead,
      telefone_lead,
      tipo_veiculo,
      criado_em,
      consultores!inner ( nome, fone ),
      indicadores!inner ( nome, telefone )
    `)
    .gte("criado_em", dataISO)
    .order("criado_em", { ascending: false });

  if (error) {
    console.error("[FATAL] Erro ao buscar indicacoes:", error.message);
    process.exit(1);
  }

  if (!data || data.length === 0) {
    console.log("Nenhuma indicacao encontrada nos ultimos " + DIAS + " dias.");
    return;
  }

  console.log(`${data.length} indicacao(oes) encontrada(s).\n`);

  let ok = 0;
  let erros = 0;
  let ignorados = 0;

  for (const row of data as unknown as IndicacaoRow[]) {
    // Supabase retorna joins como objetos quando usamos !inner
    const consultor = (row as any).consultores as { nome: string; fone: string };
    const indicador = (row as any).indicadores as { nome: string; telefone: string };

    const consultorNome = consultor?.nome ?? "(sem nome)";
    const consultorFone = consultor?.fone ?? "";
    const indicadorNome = indicador?.nome ?? null;
    const criadoEm = new Date(row.criado_em).toLocaleString("pt-BR");

    if (!consultorFone) {
      console.log(`[IGNORADO] Placa ${row.placa} (${criadoEm}) -> consultor ${consultorNome} sem telefone cadastrado`);
      ignorados++;
      continue;
    }

    if (!whatsappHabilitado) {
      console.log(`[LISTAGEM] Placa ${row.placa} (${criadoEm}) -> consultor ${consultorNome} (${consultorFone}) | indicador: ${indicadorNome ?? "-"}`);
      continue;
    }

    const enviado = await notificarNovoLead({
      nomeConsultor: consultorNome,
      telefoneConsultor: consultorFone,
      placa: row.placa,
      nomeLead: row.nome_lead,
      telefoneLead: row.telefone_lead,
      viaIndicador: indicadorNome,
    });

    if (enviado) {
      console.log(`[OK] Placa ${row.placa} (${criadoEm}) -> consultor ${consultorNome} (${consultorFone})`);
      ok++;
    } else {
      console.log(`[ERRO] Placa ${row.placa} (${criadoEm}) -> consultor ${consultorNome} (${consultorFone}) - falha no envio`);
      erros++;
    }

    // Pequena pausa entre envios para nao sobrecarregar a API
    await new Promise((r) => setTimeout(r, 500));
  }

  console.log("\n--- Resumo ---");
  if (whatsappHabilitado) {
    console.log(`Enviados com sucesso: ${ok}`);
    console.log(`Erros de envio:       ${erros}`);
    console.log(`Ignorados (sem fone): ${ignorados}`);
  } else {
    console.log(`Total listado: ${data.length - ignorados}`);
    console.log(`Ignorados (sem fone): ${ignorados}`);
    console.log("\nPara enviar de verdade, adicione EVOLUTION_API_URL, EVOLUTION_API_KEY e EVOLUTION_INSTANCE ao .env.local");
  }
}

main().catch((err) => {
  console.error("[FATAL]", err);
  process.exit(1);
});
