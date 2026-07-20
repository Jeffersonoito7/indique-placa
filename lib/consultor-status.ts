import "server-only";
import { supabaseAdmin } from "./supabase-server";

export async function verificarBloqueioConsultor(consultor_id: string): Promise<{
  bloqueado: boolean;
  motivo: string | null;
  total_pendente: number;
  limite: number;
}> {
  const [configRes, pendentesRes] = await Promise.all([
    supabaseAdmin
      .from("configuracoes")
      .select("limite_comissoes_pendentes")
      .limit(1)
      .single(),
    supabaseAdmin
      .from("indicacoes")
      .select("id", { count: "exact", head: true })
      .eq("consultor_id", consultor_id)
      .eq("status", "fechado")
      .eq("comissao_paga", false)
      .not("indicador_id", "is", null),
  ]);

  const limite: number = (configRes.data as any)?.limite_comissoes_pendentes ?? 3;
  const total_pendente = pendentesRes.count ?? 0;

  if (total_pendente >= limite) {
    return {
      bloqueado: true,
      motivo: `Voce tem ${total_pendente} comissoes pendentes de pagamento. Pague para desbloquear.`,
      total_pendente,
      limite,
    };
  }

  return { bloqueado: false, motivo: null, total_pendente, limite };
}
