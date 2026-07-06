export const dynamic = "force-dynamic";
import { getConsultorLogado } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, CheckCircle2, Clock } from "lucide-react";

const COMISSAO_POR_FECHADO = 50; // R$

function moeda(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function ConsultorFinanceiroPage() {
  const consultor = await getConsultorLogado();
  if (!consultor) redirect("/consultor/login");

  const { data: leads } = await supabaseAdmin
    .from("indicacoes")
    .select("id, nome_lead, telefone_lead, status, criado_em, indicadores(nome)")
    .eq("consultor_id", consultor.id)
    .order("criado_em", { ascending: false });

  const todos = leads ?? [];
  const fechados = todos.filter((l) => l.status === "fechado");
  const emAndamento = todos.filter((l) => l.status === "contato");
  const totalGanho = fechados.length * COMISSAO_POR_FECHADO;
  const potencial = (fechados.length + emAndamento.length) * COMISSAO_POR_FECHADO;

  return (
    <div className="flex-1 flex flex-col">
      <div className="px-8 py-5 border-b border-border">
        <h1 className="text-base font-bold text-foreground">Financeiro</h1>
        <p className="text-[11px] text-muted-foreground mt-0.5">Suas comissões por leads fechados</p>
      </div>

      <div className="flex-1 p-8 bg-muted/30 space-y-6">
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total acumulado", valor: moeda(totalGanho), icon: DollarSign, color: "text-emerald-500", bg: "bg-emerald-500/10" },
            { label: "Em andamento (potencial)", valor: moeda(potencial - totalGanho), icon: TrendingUp, color: "text-amber-500", bg: "bg-amber-500/10" },
            { label: "Leads fechados", valor: fechados.length, icon: CheckCircle2, color: "text-blue-500", bg: "bg-blue-500/10" },
          ].map(({ label, valor, icon: Icon, color, bg }) => (
            <Card key={label} className="shadow-sm">
              <CardContent className="p-5 flex items-start gap-3">
                <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={color} style={{ width: 18, height: 18 }} />
                </div>
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
                  <div className="text-xl font-bold text-foreground mt-0.5">{valor}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="shadow-sm">
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Histórico de Fechamentos
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {fechados.length === 0 ? (
              <div className="text-center text-sm text-muted-foreground py-14">
                Nenhum lead fechado ainda. Continue prospectando!
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    {["Lead", "Via Indicador", "Comissão", "Data"].map((h) => (
                      <th key={h} className="text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-6 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {fechados.map((l, i) => (
                    <tr key={l.id} className={`border-b border-border hover:bg-accent/40 transition-colors ${i % 2 !== 0 ? "bg-muted/20" : ""}`}>
                      <td className="px-6 py-3.5 text-sm font-medium">{l.nome_lead}</td>
                      <td className="px-6 py-3.5 text-sm text-muted-foreground">
                        {(l.indicadores as any)?.nome ?? <span className="italic text-muted-foreground/50">direto</span>}
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{moeda(COMISSAO_POR_FECHADO)}</span>
                      </td>
                      <td className="px-6 py-3.5 text-xs text-muted-foreground">{new Date(l.criado_em).toLocaleDateString("pt-BR")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
