export const dynamic = "force-dynamic";
import { getConsultorLogado } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Medal, Award } from "lucide-react";
import { cn } from "@/lib/utils";

export default async function ConsultorRankingPage() {
  const consultor = await getConsultorLogado();
  if (!consultor) redirect("/consultor/login");

  const { data: indicacoes } = await supabaseAdmin
    .from("indicacoes")
    .select("consultor_id, status, consultores(nome)");

  const map: Record<string, { nome: string; total: number; fechados: number }> = {};
  for (const ind of indicacoes ?? []) {
    const id = ind.consultor_id;
    if (!id) continue;
    if (!map[id]) map[id] = { nome: (ind.consultores as any)?.nome ?? "?", total: 0, fechados: 0 };
    map[id].total++;
    if (ind.status === "fechado") map[id].fechados++;
  }

  const ranking = Object.entries(map)
    .map(([id, v]) => ({ id, ...v, taxa: v.total > 0 ? Math.round((v.fechados / v.total) * 100) : 0 }))
    .sort((a, b) => b.fechados - a.fechados)
    .slice(0, 20);

  const minhaPosicao = ranking.findIndex((r) => r.id === consultor.id) + 1;

  const medalStyle = [
    { text: "text-amber-500", label: "1o" },
    { text: "text-slate-400", label: "2o" },
    { text: "text-orange-600", label: "3o" },
  ];

  return (
    <div className="flex-1 flex flex-col">
      <div className="px-8 py-5 border-b border-border flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-foreground">Ranking</h1>
          <p className="text-[11px] text-muted-foreground mt-0.5">Classificação geral de consultores</p>
        </div>
        {minhaPosicao > 0 && (
          <div className="flex items-center gap-2 bg-amber-500/10 text-amber-500 px-4 py-2 rounded-xl">
            <Trophy className="h-4 w-4" />
            <span className="text-sm font-bold">Você está em #{minhaPosicao}</span>
          </div>
        )}
      </div>
      <div className="flex-1 p-8 bg-muted/30">
        <Card className="shadow-sm">
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle className="text-sm font-semibold">Classificação Geral</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {!ranking.length ? (
              <div className="text-center text-muted-foreground text-sm py-16">Sem dados ainda</div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    {["Pos.", "Consultor", "Leads", "Fechados", "Taxa"].map((h) => (
                      <th key={h} className="text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-6 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ranking.map((c, i) => {
                    const isEu = c.id === consultor.id;
                    return (
                      <tr key={c.id} className={cn(
                        "border-b border-border transition-colors",
                        isEu ? "bg-emerald-500/5 hover:bg-emerald-500/10" : cn("hover:bg-accent/40", i % 2 !== 0 && "bg-muted/20")
                      )}>
                        <td className="px-6 py-3.5">
                          <span className={cn("text-sm font-bold", i === 0 ? "text-amber-500" : i === 1 ? "text-slate-400" : i === 2 ? "text-orange-600" : "text-muted-foreground")}>#{i + 1}</span>
                        </td>
                        <td className="px-6 py-3.5 text-sm font-medium text-foreground">
                          {c.nome} {isEu && <span className="ml-1 text-[10px] bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded font-bold">VOCÊ</span>}
                        </td>
                        <td className="px-6 py-3.5 text-sm text-muted-foreground">{c.total}</td>
                        <td className="px-6 py-3.5"><span className="text-sm font-bold text-emerald-500">{c.fechados}</span></td>
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden max-w-[60px]">
                              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${c.taxa}%` }} />
                            </div>
                            <span className="text-xs text-muted-foreground">{c.taxa}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
