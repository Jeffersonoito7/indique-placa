export const dynamic = "force-dynamic";
import { getIndicadorLogado } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target } from "lucide-react";
import { cn } from "@/lib/utils";

function moeda(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const TIPO_LABELS: Record<string, string> = {
  todos: "Todos os veiculos",
  moto: "Moto",
  carro: "Carro",
  caminhao: "Caminhao",
};

export default async function IndicadorMetasPage() {
  const indicador = await getIndicadorLogado();
  if (!indicador) redirect("/indicador/login");

  if (!indicador.consultor_id) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center text-sm text-muted-foreground">Voce nao esta vinculado a nenhum consultor.</div>
      </div>
    );
  }

  const [{ data: metas }, { data: indicacoesFechadas }] = await Promise.all([
    supabaseAdmin
      .from("metas")
      .select("id, nome, descricao, tipo_veiculo, quantidade_indicacoes, bonus_valor")
      .eq("consultor_id", indicador.consultor_id)
      .eq("ativo", true)
      .order("criado_em", { ascending: false }),
    supabaseAdmin
      .from("indicacoes")
      .select("tipo_veiculo")
      .eq("indicador_id", indicador.id)
      .eq("status", "fechado"),
  ]);

  const totalFechados = indicacoesFechadas?.length ?? 0;
  const fechadosPorTipo: Record<string, number> = {};
  for (const ind of indicacoesFechadas ?? []) {
    const t = (ind as any).tipo_veiculo ?? "carro";
    fechadosPorTipo[t] = (fechadosPorTipo[t] ?? 0) + 1;
  }

  const metasComProgresso = (metas ?? []).map((m) => {
    const progresso = m.tipo_veiculo === "todos" ? totalFechados : (fechadosPorTipo[m.tipo_veiculo] ?? 0);
    const pct = Math.min(100, Math.round((progresso / m.quantidade_indicacoes) * 100));
    const batida = progresso >= m.quantidade_indicacoes;
    const quase = !batida && pct >= 80;
    return { ...m, progresso, pct, batida, quase };
  });

  return (
    <div className="flex-1 flex flex-col">
      <div className="px-8 py-5 border-b border-border">
        <h1 className="text-base font-bold text-foreground">Minhas Metas</h1>
        <p className="text-[11px] text-muted-foreground mt-0.5">Acompanhe seu progresso e conquiste bonus</p>
      </div>
      <div className="flex-1 p-8 bg-muted/30">
        {metasComProgresso.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm py-16">
            Nenhuma meta ativa no momento.
          </div>
        ) : (
          <div className="max-w-2xl space-y-4">
            {metasComProgresso.map((m) => (
              <Card
                key={m.id}
                className={cn(
                  "shadow-sm border-t-4",
                  m.batida ? "border-t-emerald-500" : m.quase ? "border-t-amber-500" : "border-t-blue-500"
                )}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Target className={cn("h-4 w-4", m.batida ? "text-emerald-500" : m.quase ? "text-amber-500" : "text-blue-500")} />
                      {m.nome}
                    </span>
                    {m.batida ? (
                      <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-emerald-500/15 text-emerald-500 uppercase tracking-wider">Meta batida</span>
                    ) : m.quase ? (
                      <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-amber-500/15 text-amber-500 uppercase tracking-wider">Quase la!</span>
                    ) : null}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  {m.descricao && <p className="text-xs text-muted-foreground">{m.descricao}</p>}

                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs px-2 py-1 rounded-full bg-muted border border-border text-muted-foreground font-medium">
                      {TIPO_LABELS[m.tipo_veiculo] ?? m.tipo_veiculo}
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-muted border border-border text-muted-foreground font-medium">
                      {m.quantidade_indicacoes} fechamentos
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-muted-foreground">Progresso</span>
                      <span className="text-xs font-bold font-mono text-foreground">{m.progresso}/{m.quantidade_indicacoes} ({m.pct}%)</span>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all", m.batida ? "bg-emerald-500" : m.quase ? "bg-amber-500" : "bg-blue-500")}
                        style={{ width: `${m.pct}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-border">
                    <span className="text-xs text-muted-foreground">Bonus ao bater a meta:</span>
                    <span className="text-sm font-bold text-emerald-500">{moeda(m.bonus_valor)}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
