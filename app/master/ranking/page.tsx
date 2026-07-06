export const dynamic = "force-dynamic";
import { supabaseAdmin } from "@/lib/supabase-server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Medal, Award } from "lucide-react";
import { cn } from "@/lib/utils";

async function getRanking() {
  const { data: indicacoes } = await supabaseAdmin
    .from("indicacoes")
    .select("consultor_id, status, consultores(nome)");

  if (!indicacoes) return { ranking: [] };

  const map: Record<string, { nome: string; total: number; fechados: number }> = {};
  for (const ind of indicacoes) {
    const id = ind.consultor_id;
    if (!id) continue;
    if (!map[id]) map[id] = { nome: (ind.consultores as any)?.nome ?? "Desconhecido", total: 0, fechados: 0 };
    map[id].total++;
    if (ind.status === "fechado") map[id].fechados++;
  }

  const ranking = Object.entries(map)
    .map(([id, v]) => ({ id, ...v, taxa: v.total > 0 ? Math.round((v.fechados / v.total) * 100) : 0 }))
    .sort((a, b) => b.fechados - a.fechados)
    .slice(0, 20);

  return { ranking };
}

const medalStyle = [
  { bg: "bg-amber-400/10", text: "text-amber-500", icon: Trophy, label: "1o" },
  { bg: "bg-slate-400/10", text: "text-slate-400", icon: Medal, label: "2o" },
  { bg: "bg-orange-700/10", text: "text-orange-600", icon: Award, label: "3o" },
];

export default async function RankingPage() {
  const { ranking } = await getRanking();

  return (
    <div className="flex-1 flex flex-col">
      <div className="px-8 py-5 border-b border-border">
        <h1 className="text-base font-bold text-foreground">Ranking</h1>
        <p className="text-[11px] text-muted-foreground mt-0.5">Top consultores por vendas fechadas</p>
      </div>

      <div className="flex-1 p-8 bg-muted/30">
        {/* Podio top 3 */}
        {ranking.length >= 3 && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            {ranking.slice(0, 3).map((c, i) => {
              const m = medalStyle[i];
              const Icon = m.icon;
              return (
                <Card key={c.id} className={cn("border-t-4", i === 0 ? "border-t-amber-400" : i === 1 ? "border-t-slate-400" : "border-t-orange-600")}>
                  <CardContent className="p-6 text-center">
                    <div className={cn("w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3", m.bg)}>
                      <Icon className={cn("h-6 w-6", m.text)} />
                    </div>
                    <div className="text-sm font-bold text-foreground mb-1">{c.nome}</div>
                    <div className={cn("text-3xl font-bold mb-1", m.text)}>{c.fechados}</div>
                    <div className="text-[10px] text-muted-foreground">vendas fechadas</div>
                    <div className="text-[10px] text-muted-foreground mt-1">{c.total} leads / {c.taxa}% taxa</div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Tabela completa */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle className="text-sm font-semibold">Classificação Geral</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {ranking.length === 0 ? (
              <div className="text-center text-muted-foreground text-sm py-16">Sem dados de indicações ainda</div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    {["Pos.", "Consultor", "Total Leads", "Fechados", "Taxa de Conversão"].map((h) => (
                      <th key={h} className="text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-6 py-3">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ranking.map((c, i) => (
                    <tr key={c.id} className={cn("border-b border-border hover:bg-accent/40 transition-colors", i % 2 !== 0 && "bg-muted/20")}>
                      <td className="px-6 py-3.5">
                        <span className={cn("text-sm font-bold", i === 0 ? "text-amber-500" : i === 1 ? "text-slate-400" : i === 2 ? "text-orange-600" : "text-muted-foreground")}>
                          #{i + 1}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-sm font-medium text-foreground">{c.nome}</td>
                      <td className="px-6 py-3.5 text-sm text-muted-foreground">{c.total}</td>
                      <td className="px-6 py-3.5">
                        <span className="text-sm font-bold text-emerald-500">{c.fechados}</span>
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden max-w-[80px]">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${c.taxa}%` }} />
                          </div>
                          <span className="text-xs text-muted-foreground">{c.taxa}%</span>
                        </div>
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
  );
}
