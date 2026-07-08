export const dynamic = "force-dynamic";
import { supabaseAdmin } from "@/lib/supabase-server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, ClipboardList, CheckCircle2, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

type LinhaRelatorio = {
  id: string;
  nome: string;
  fone: string;
  ativo: boolean;
  total_indicacoes: number;
  total_fechadas: number;
  taxa_conversao: number;
  total_comissoes: number;
};

async function getRelatorio(): Promise<{ relatorio: LinhaRelatorio[] }> {
  const { data: consultores, error } = await supabaseAdmin
    .from("consultores")
    .select(`
      id, nome, fone, ativo,
      indicacoes(id, status, comissao_valor, criado_em)
    `);

  if (error || !consultores) return { relatorio: [] };

  const relatorio: LinhaRelatorio[] = consultores.map((c) => {
    const todas = (c.indicacoes as { id: string; status: string; comissao_valor: number | null; criado_em: string }[]) ?? [];
    const fechadas = todas.filter((i) => i.status === "fechado");
    const comissoes = fechadas.reduce((acc, i) => acc + (i.comissao_valor ?? 0), 0);
    const conversao = todas.length > 0 ? Math.round((fechadas.length / todas.length) * 100) : 0;
    return {
      id: c.id as string,
      nome: c.nome as string,
      fone: c.fone as string,
      ativo: c.ativo as boolean,
      total_indicacoes: todas.length,
      total_fechadas: fechadas.length,
      taxa_conversao: conversao,
      total_comissoes: comissoes,
    };
  });

  relatorio.sort((a, b) => b.total_fechadas - a.total_fechadas);

  return { relatorio };
}

function formatarMoeda(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatarData() {
  return new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default async function RelatorioPage() {
  const { relatorio } = await getRelatorio();

  const totalAtivos = relatorio.filter((r) => r.ativo).length;
  const totalIndicacoes = relatorio.reduce((acc, r) => acc + r.total_indicacoes, 0);
  const totalFechadas = relatorio.reduce((acc, r) => acc + r.total_fechadas, 0);
  const taxaMedia =
    totalIndicacoes > 0 ? Math.round((totalFechadas / totalIndicacoes) * 100) : 0;

  const maxTotal = Math.max(...relatorio.map((r) => r.total_indicacoes), 1);

  const cards = [
    { label: "Consultores ativos", valor: totalAtivos, icon: Users, cor: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Total de indicacoes", valor: totalIndicacoes, icon: ClipboardList, cor: "text-amber-500", bg: "bg-amber-500/10" },
    { label: "Vendas fechadas", valor: totalFechadas, icon: CheckCircle2, cor: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "Taxa de conversao media", valor: `${taxaMedia}%`, icon: TrendingUp, cor: "text-violet-500", bg: "bg-violet-500/10" },
  ];

  return (
    <div className="flex-1 flex flex-col">
      <div className="px-8 py-5 border-b border-border flex items-start justify-between">
        <div>
          <h1 className="text-base font-bold text-foreground">Relatorio de Consultores</h1>
          <p className="text-[11px] text-muted-foreground mt-0.5">Desempenho geral por consultor — {formatarData()}</p>
        </div>
      </div>

      <div className="flex-1 p-8 bg-muted/30 space-y-6">
        {/* Cards de resumo */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((c) => {
            const Icon = c.icon;
            return (
              <Card key={c.label} className="shadow-sm">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", c.bg)}>
                    <Icon className={cn("h-5 w-5", c.cor)} />
                  </div>
                  <div>
                    <div className="text-xl font-bold text-foreground">{c.valor}</div>
                    <div className="text-[11px] text-muted-foreground leading-tight">{c.label}</div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Tabela */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle className="text-sm font-semibold">Desempenho por Consultor</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {relatorio.length === 0 ? (
              <div className="text-center text-muted-foreground text-sm py-16">Nenhum dado disponivel ainda.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px]">
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      {["Consultor", "Indicacoes", "Fechadas", "Conversao", "Comissoes geradas", "Status"].map((h) => (
                        <th
                          key={h}
                          className="text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-6 py-3"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {relatorio.map((item, i) => {
                      let badgeCor = "bg-red-100 text-red-800";
                      if (item.taxa_conversao >= 30) badgeCor = "bg-green-100 text-green-800";
                      else if (item.taxa_conversao >= 15) badgeCor = "bg-yellow-100 text-yellow-800";

                      return (
                        <tr
                          key={item.id}
                          className={cn(
                            "border-b border-border hover:bg-accent/40 transition-colors",
                            i % 2 !== 0 && "bg-muted/20"
                          )}
                        >
                          {/* Consultor */}
                          <td className="px-6 py-3.5">
                            <div className="text-sm font-medium text-foreground">{item.nome}</div>
                            <div className="text-[10px] text-muted-foreground">{item.fone}</div>
                          </td>

                          {/* Indicacoes com barra */}
                          <td className="px-6 py-3.5">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-mono w-6 text-right shrink-0">{item.total_indicacoes}</span>
                              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden min-w-[60px]">
                                <div
                                  className="h-full bg-amber-500 rounded-full"
                                  style={{ width: `${Math.min((item.total_indicacoes / maxTotal) * 100, 100)}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          {/* Fechadas */}
                          <td className="px-6 py-3.5">
                            <span className="text-sm font-bold text-emerald-500">{item.total_fechadas}</span>
                          </td>

                          {/* Conversao */}
                          <td className="px-6 py-3.5">
                            <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold", badgeCor)}>
                              {item.taxa_conversao}%
                            </span>
                          </td>

                          {/* Comissoes */}
                          <td className="px-6 py-3.5 text-sm text-foreground">
                            {formatarMoeda(item.total_comissoes)}
                          </td>

                          {/* Status */}
                          <td className="px-6 py-3.5">
                            <span
                              className={cn(
                                "inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold",
                                item.ativo ? "bg-emerald-100 text-emerald-800" : "bg-muted text-muted-foreground"
                              )}
                            >
                              {item.ativo ? "Ativo" : "Inativo"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
