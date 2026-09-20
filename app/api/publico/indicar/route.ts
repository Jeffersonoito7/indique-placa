import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { rateLimit, getRateLimitKey } from "@/lib/rate-limit";
import { notificarNovoLead, notificarNovoLeadGestor } from "@/lib/whatsapp";
import { verificarBloqueioConsultor } from "@/lib/consultor-status";
import { z } from "zod";

const schema = z.object({
  placa: z.string().min(7).max(7).regex(/^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/, "Placa inválida"),
  nome_lead: z.string().min(2).max(100),
  telefone_lead: z.string().min(10).max(20),
  consultor_id: z.string().uuid().optional().nullable(),
  indicador_id: z.string().uuid().optional().nullable(),
  tipo_veiculo: z.enum(["moto", "carro", "caminhao"]).default("carro"),
});

export async function POST(req: NextRequest) {
  const { allowed: rlAllowed } = await rateLimit(getRateLimitKey(req, "indicar"), 5, 60 * 1000);
  if (!rlAllowed) {
    return NextResponse.json({ error: "Muitas tentativas. Aguarde 1 minuto." }, { status: 429 });
  }

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Requisição inválida" }, { status: 400 }); }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

  const { placa, nome_lead, telefone_lead, consultor_id, indicador_id, tipo_veiculo } = parsed.data;
  const tel = telefone_lead?.replace(/\D/g, "") ?? null;

  let iid = indicador_id ?? null;
  let cid = consultor_id ?? null;

  // Se veio pelo link do indicador, resolve o consultor a partir do indicador
  if (iid && !cid) {
    const { data: indic } = await supabaseAdmin
      .from("indicadores")
      .select("id, consultor_id, status")
      .eq("id", iid)
      .maybeSingle();
    if (!indic || indic.status !== "ativo") {
      iid = null;
    } else {
      cid = indic.consultor_id ?? null;
    }
  }

  // Guarda a associação de origem antes de descartar o consultor: é ela que
  // delimita para quem o lead pode ir.
  let associacaoOrigem: string | null = null;

  if (cid) {
    const { data: consultor } = await supabaseAdmin
      .from("consultores")
      .select("id, status, associacao_id")
      .eq("id", cid)
      .maybeSingle();
    if (!consultor || consultor.status !== "ativo") {
      cid = null;
    } else {
      associacaoOrigem = consultor.associacao_id ?? null;
      const bloqueio = await verificarBloqueioConsultor(cid);
      if (bloqueio.bloqueado) cid = null;
    }
  }

  // Consultor padrão da PRÓPRIA associação de origem. Antes vinha de uma linha
  // global de `configuracoes`, sem filtro de tenant, o que permitia entregar o
  // lead de uma associação ao consultor padrão de outra.
  if (!cid && associacaoOrigem) {
    const { data: assoc } = await supabaseAdmin
      .from("associacoes")
      .select("consultor_padrao_id")
      .eq("id", associacaoOrigem)
      .maybeSingle();

    const padraoId = assoc?.consultor_padrao_id ?? null;

    if (padraoId) {
      // O padrão também precisa estar apto: ativo, não bloqueado e da mesma associação.
      const { data: padrao } = await supabaseAdmin
        .from("consultores")
        .select("id, status, associacao_id")
        .eq("id", padraoId)
        .eq("associacao_id", associacaoOrigem)
        .maybeSingle();

      if (padrao && padrao.status === "ativo") {
        const bloqueio = await verificarBloqueioConsultor(padrao.id);
        if (!bloqueio.bloqueado) cid = padrao.id;
      }
    }
  }

  // Deduplicacao por placa dentro da associacao
  if (cid) {
    const { data: consultorAssoc } = await supabaseAdmin
      .from("consultores")
      .select("associacao_id")
      .eq("id", cid)
      .maybeSingle();

    if (consultorAssoc?.associacao_id) {
      const { data: consultoresDaAssoc } = await supabaseAdmin
        .from("consultores")
        .select("id")
        .eq("associacao_id", consultorAssoc.associacao_id);

      const ids = (consultoresDaAssoc ?? []).map((c) => c.id);

      const { data: existente } = await supabaseAdmin
        .from("indicacoes")
        .select("id")
        .in("consultor_id", ids)
        .eq("placa", placa)
        .limit(1)
        .maybeSingle();

      if (existente) return NextResponse.json({ error: "Esta placa já foi indicada anteriormente." }, { status: 409 });
    }
  }

  const { error } = await supabaseAdmin.from("indicacoes").insert({
    placa,
    nome_lead: nome_lead ?? null,
    telefone_lead: tel,
    consultor_id: cid,
    indicador_id: iid ?? null,
    tipo_veiculo: tipo_veiculo ?? "carro",
    status: "novo",
  });

  if (error) {
    if (error.code === "23505") return NextResponse.json({ error: "Esta placa já foi indicada anteriormente." }, { status: 409 });
    return NextResponse.json({ error: "Erro ao salvar" }, { status: 500 });
  }

  if (cid) {
    void (async () => {
      const { data } = await supabaseAdmin
        .from("consultores")
        .select("nome, fone, gestor_id")
        .eq("id", cid)
        .maybeSingle();

      if (!data) return;

      notificarNovoLead({
        nomeConsultor: data.nome,
        telefoneConsultor: data.fone,
        placa,
        nomeLead: nome_lead ?? null,
        telefoneLead: tel,
      }).catch((err) => console.error("[indicar] notificarNovoLead falhou:", err));

      if (data.gestor_id) {
        const { data: gestor } = await supabaseAdmin
          .from("gestores")
          .select("nome, fone")
          .eq("id", data.gestor_id)
          .maybeSingle();

        if (gestor?.fone) {
          notificarNovoLeadGestor({
            nomeGestor: gestor.nome,
            telefoneGestor: gestor.fone,
            nomeConsultor: data.nome,
            placa,
            nomeLead: nome_lead ?? null,
            telefoneLead: tel,
          }).catch((err) => console.error("[indicar] notificarNovoLeadGestor falhou:", err));
        }
      }
    })().catch((err) => console.error("[indicar] bloco de notificacao falhou:", err));
  }

  return NextResponse.json({ ok: true });
}
