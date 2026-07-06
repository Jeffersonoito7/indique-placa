export const dynamic = "force-dynamic";
import { supabaseAdmin } from "@/lib/supabase-server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, Users, CheckCircle2, Info } from "lucide-react";

const COMISSAO_CONSULTOR = 50;  // R$ por lead fechado
const COMISSAO_INDICADOR = 20;  // R$ por lead fechado via indicador

async function getDados() {
  const { data: fechados } = await supabaseAdmin
    .from("indicacoes")
    .select("id, nome_lead, criado_em, consultor_id, indicador_id, consultores(nome), indicadores(nome)")
    .eq("status", "fechado")
    .order("criado_em", { ascending: false });

  return fechados ?? [];
}

type Lead = Awaited<ReturnType<typeof getDados>>[number];

function moeda(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function FinanceiroPage() {
  const fechados = await getDados();

  const totalConsultores = fechados.length * COMISSAO_CONSULTOR;
  const comIndicador = fechados.filter((l) => l.indicador_id);
  const totalIndicadores = comIndicador.length * COMISSAO_INDICADOR;
  const totalPagar = totalConsultores + totalIndicadores;

  // Agrupa por consultor
  const porConsultor: Record<string, { nome: string; qtd: number; totalComissao: number }> = {};
  for (const l of fechados) {
    const id = l.consultor_id as string;
    const nome = (l.consultores as any)?.nome ?? "Sem nome";
    if (!porConsultor[id]) porConsultor[id] = { nome, qtd: 0, totalComissao: 0 };
    porConsultor[id].qtd++;
    porConsultor[id].totalComissao += COMISSAO_CONSULTOR;
    if (l.indicador_id) porConsultor[id].totalComissao += 0; // indicador recebe direto
  }

  const rankConsultores = Object.values(porConsultor).sort((a, b) => b.qtd - a.qtd);

  return (
    <div className="flex-1 flex flex-col">
      <div className="px-8 py-5 border-b border-border flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-foreground">Financeiro</h1>
          <p className="text-[11px] text-muted-foreground mt-0.5">Comissões sobre leads fechados</p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-600 dark:text-amber-400">
          <Info className="h-3.5 w-3.5" />
          Consultor: {moeda(COMISSAO_CONSULTOR)}/fechado | Indicador: {moeda(COMISSAO_INDICADOR)}/fechado
        </div>
      </div>

      <div className="flex-1 p-8 bg-muted/30 space-y-6">
        {/* Metricas */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Leads Fechados", valor: fechados.length, icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10" },
            { label: "A pagar consultores", valor: moeda(totalConsultores), icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
            { label: "A pagar indicadores", valor: moeda(totalIndicadores), icon: TrendingUp, color: "text-violet-500", bg: "bg-violet-500/10" },
            { label: "Total a pagar", valor: moeda(totalPagar), icon: DollarSign, color: "text-amber-500", bg: "bg-amber-500/10" },
          ].map(({ label, valor, icon: Icon, color, bg }) => (
            <Card key={label} className="shadow-sm">
              <CardContent className="p-5 flex items-start gap-3">
                <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`h-4.5 w-4.5 ${color}`} style={{ width: 18, height: 18 }} />
                </div>
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
                  <div className="text-lg font-bold text-foreground mt-0.5">{valor}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Ranking consultores */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-sm font-semibold">Comissões por Consultor</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {rankConsultores.length === 0 ? (
                <div className="text-center text-xs text-muted-foreground py-10">Nenhum fechamento ainda</div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      {["Consultor", "Fechados", "Comissão"].map((h) => (
                        <th key={h} className="text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-5 py-2.5">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rankConsultores.map((c, i) => (
                      <tr key={i} className="border-b border-border hover:bg-accent/30 transition-colors">
                        <td className="px-5 py-3 text-sm font-medium">{c.nome}</td>
                        <td className="px-5 py-3 text-sm text-center">
                          <span className="bg-emerald-500/10 text-emerald-500 text-xs font-bold px-2 py-0.5 rounded-full">{c.qtd}</span>
                        </td>
                        <td className="px-5 py-3 text-sm font-bold text-emerald-600 dark:text-emerald-400">{moeda(c.totalComissao)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>

          {/* Histórico detalhado */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-sm font-semibold">Histórico de Fechamentos</CardTitle>
            </CardHeader>
            <CardContent className="p-0 max-h-96 overflow-y-auto">
              {fechados.length === 0 ? (
                <div className="text-center text-xs text-muted-foreground py-10">Nenhum fechamento ainda</div>
              ) : (
                <table className="w-full">
                  <thead className="sticky top-0">
                    <tr className="border-b border-border bg-card">
                      {["Lead", "Via", "Data"].map((h) => (
                        <th key={h} className="text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-5 py-2.5">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {fechados.map((l) => (
                      <tr key={l.id} className="border-b border-border hover:bg-accent/30 transition-colors">
                        <td className="px-5 py-3 text-xs font-medium">{l.nome_lead}</td>
                        <td className="px-5 py-3 text-xs text-muted-foreground">
                          {(l.indicadores as any)?.nome
                            ? <span className="text-violet-500">{(l.indicadores as any).nome}</span>
                            : <span className="italic text-muted-foreground/50">direto</span>}
                        </td>
                        <td className="px-5 py-3 text-xs text-muted-foreground">
                          {new Date(l.criado_em).toLocaleDateString("pt-BR")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
