"use client";

import { useEffect, useState, useCallback } from "react";
import { BarChart3, Building2, ShieldCheck, Users, UserCheck, ClipboardList, TrendingUp, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type BIData = {
  periodo: string;
  totais: {
    associacoes: number;
    gestores: number;
    consultores: number;
    indicadores: number;
    leads: number;
    fechamentos: number;
    comissoes_total: number;
  };
  por_associacao: Array<{
    id: string; nome: string; plano: string;
    total_gestores: number; total_consultores: number; total_indicadores: number;
    total_leads: number; total_fechamentos: number; taxa_conversao: number;
  }>;
  ranking_consultores: Array<{
    id: string; nome: string; fone: string; associacao: string | null;
    gestor: string | null; cidade: string | null;
    total_leads: number; total_fechamentos: number; total_comissoes: number; taxa_conversao: number;
  }>;
  ranking_gestores: Array<{
    id: string; nome: string; associacao: string | null;
    total_consultores: number; total_leads_equipe: number; total_fechamentos_equipe: number;
  }>;
  ranking_indicadores: Array<{
    id: string; nome: string; consultor: string | null;
    total_leads: number; total_fechamentos: number; total_comissoes: number;
  }>;
  por_cidade: Array<{
    cidade: string; total_consultores: number; total_leads: number; total_fechamentos: number;
  }>;
  evolucao_mensal: Array<{ mes: string; leads: number; fechamentos: number }>;
};

function fmt(n: number) {
  return n.toLocaleString("pt-BR");
}

function fmtBrl(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const periodoLabels: Record<string, string> = { "7d": "7 dias", "30d": "30 dias", "90d": "90 dias" };

export default function BIPage() {
  const [periodo, setPeriodo] = useState<"7d" | "30d" | "90d">("30d");
  const [data, setData] = useState<BIData | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async (p: string) => {
    setLoading(true);
    setErro(null);
    try {
      const res = await fetch(`/api/master/bi?periodo=${p}`);
      if (!res.ok) throw new Error("Erro ao carregar dados");
      const json = await res.json();
      setData(json);
    } catch {
      setErro("Erro ao carregar dados de BI");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { carregar(periodo); }, [periodo, carregar]);

  const totais = data?.totais;

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Header */}
      <div className="px-8 py-5 border-b border-border flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-5 w-5 text-violet-400" />
          <div>
            <h1 className="text-base font-bold text-foreground">Business Intelligence</h1>
            <p className="text-[11px] text-muted-foreground mt-0.5">Visao consolidada da plataforma</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Periodo:</span>
          {(["7d", "30d", "90d"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriodo(p)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium border transition-colors",
                periodo === p
                  ? "bg-violet-500/20 border-violet-500/40 text-violet-400"
                  : "border-border text-muted-foreground hover:border-violet-500/30 hover:text-violet-400"
              )}
            >
              {periodoLabels[p]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 bg-muted/30 space-y-8">
        {loading && (
          <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">Carregando...</div>
        )}
        {erro && (
          <div className="flex items-center justify-center h-40 text-red-400 text-sm">{erro}</div>
        )}

        {!loading && !erro && data && (
          <>
            {/* Secao 1 - Totais */}
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Totais Gerais</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-7 gap-4">
                {[
                  { label: "Associacoes", value: fmt(totais!.associacoes), icon: Building2, color: "text-violet-400", border: "border-t-violet-500" },
                  { label: "Gestores", value: fmt(totais!.gestores), icon: ShieldCheck, color: "text-cyan-400", border: "border-t-cyan-500" },
                  { label: "Consultores", value: fmt(totais!.consultores), icon: Users, color: "text-emerald-400", border: "border-t-emerald-500" },
                  { label: "Indicadores", value: fmt(totais!.indicadores), icon: UserCheck, color: "text-amber-400", border: "border-t-amber-500" },
                  { label: "Leads", value: fmt(totais!.leads), icon: ClipboardList, color: "text-blue-400", border: "border-t-blue-500" },
                  { label: "Fechamentos", value: fmt(totais!.fechamentos), icon: TrendingUp, color: "text-emerald-400", border: "border-t-emerald-500" },
                  { label: "Comissoes", value: fmtBrl(totais!.comissoes_total), icon: DollarSign, color: "text-amber-400", border: "border-t-amber-500", wide: true },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <Card key={item.label} className={cn("border-t-4", item.border, item.wide && "md:col-span-1 xl:col-span-1")}>
                      <CardContent className="p-5">
                        <div className="flex items-center gap-2 mb-2">
                          <Icon className={cn("h-4 w-4", item.color)} />
                          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{item.label}</span>
                        </div>
                        <div className={cn("text-2xl font-bold", item.color)}>{item.value}</div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </section>

            {/* Secao 2 - Por Associacao */}
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Por Associacao</h2>
              <Card className="shadow-sm">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border bg-muted/40">
                          {["Nome", "Plano", "Gestores", "Consultores", "Indicadores", "Leads", "Fechamentos", "Conversao"].map((h) => (
                            <th key={h} className="text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-4 py-3">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {data.por_associacao.length === 0 && (
                          <tr><td colSpan={8} className="text-center text-muted-foreground text-sm py-10">Sem dados</td></tr>
                        )}
                        {data.por_associacao.map((row, i) => (
                          <tr key={row.id} className={cn("border-b border-border hover:bg-accent/40 transition-colors", i % 2 !== 0 && "bg-muted/20")}>
                            <td className="px-4 py-3 text-sm font-medium text-foreground">{row.nome}</td>
                            <td className="px-4 py-3">
                              <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400">{row.plano}</span>
                            </td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">{fmt(row.total_gestores)}</td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">{fmt(row.total_consultores)}</td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">{fmt(row.total_indicadores)}</td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">{fmt(row.total_leads)}</td>
                            <td className="px-4 py-3 text-sm font-bold text-emerald-400">{fmt(row.total_fechamentos)}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden max-w-[60px]">
                                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${row.taxa_conversao}%` }} />
                                </div>
                                <span className="text-xs text-muted-foreground">{row.taxa_conversao}%</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Secao 3 - Rankings */}
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Rankings do Periodo</h2>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Top Consultores */}
                <Card className="shadow-sm border-t-4 border-t-emerald-500">
                  <CardHeader className="pb-2 border-b border-border">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Users className="h-4 w-4 text-emerald-400" /> Top Consultores
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {data.ranking_consultores.slice(0, 10).map((c, i) => (
                      <div key={c.id} className="flex items-center justify-between px-4 py-2.5 border-b border-border last:border-0 hover:bg-accent/30 transition-colors">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs font-bold text-muted-foreground w-5 shrink-0">#{i + 1}</span>
                          <div className="min-w-0">
                            <div className="text-xs font-medium text-foreground truncate">{c.nome}</div>
                            {c.associacao && <div className="text-[10px] text-muted-foreground truncate">{c.associacao}</div>}
                          </div>
                        </div>
                        <div className="text-right shrink-0 ml-2">
                          <div className="text-sm font-bold text-emerald-400">{fmt(c.total_fechamentos)}</div>
                          <div className="text-[10px] text-muted-foreground">{fmtBrl(c.total_comissoes)}</div>
                        </div>
                      </div>
                    ))}
                    {data.ranking_consultores.length === 0 && (
                      <div className="text-center text-muted-foreground text-xs py-8">Sem dados no periodo</div>
                    )}
                  </CardContent>
                </Card>

                {/* Top Gestores */}
                <Card className="shadow-sm border-t-4 border-t-cyan-500">
                  <CardHeader className="pb-2 border-b border-border">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-cyan-400" /> Top Gestores
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {data.ranking_gestores.slice(0, 5).map((g, i) => (
                      <div key={g.id} className="flex items-center justify-between px-4 py-2.5 border-b border-border last:border-0 hover:bg-accent/30 transition-colors">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs font-bold text-muted-foreground w-5 shrink-0">#{i + 1}</span>
                          <div className="min-w-0">
                            <div className="text-xs font-medium text-foreground truncate">{g.nome}</div>
                            <div className="text-[10px] text-muted-foreground">{fmt(g.total_consultores)} consultores</div>
                          </div>
                        </div>
                        <div className="text-right shrink-0 ml-2">
                          <div className="text-sm font-bold text-cyan-400">{fmt(g.total_fechamentos_equipe)}</div>
                          <div className="text-[10px] text-muted-foreground">fechamentos</div>
                        </div>
                      </div>
                    ))}
                    {data.ranking_gestores.length === 0 && (
                      <div className="text-center text-muted-foreground text-xs py-8">Sem dados no periodo</div>
                    )}
                  </CardContent>
                </Card>

                {/* Top Indicadores */}
                <Card className="shadow-sm border-t-4 border-t-amber-500">
                  <CardHeader className="pb-2 border-b border-border">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-amber-400" /> Top Indicadores
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {data.ranking_indicadores.map((ind, i) => (
                      <div key={ind.id} className="flex items-center justify-between px-4 py-2.5 border-b border-border last:border-0 hover:bg-accent/30 transition-colors">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs font-bold text-muted-foreground w-5 shrink-0">#{i + 1}</span>
                          <div className="min-w-0">
                            <div className="text-xs font-medium text-foreground truncate">{ind.nome}</div>
                            {ind.consultor && <div className="text-[10px] text-muted-foreground truncate">{ind.consultor}</div>}
                          </div>
                        </div>
                        <div className="text-right shrink-0 ml-2">
                          <div className="text-sm font-bold text-amber-400">{fmt(ind.total_leads)} leads</div>
                          <div className="text-[10px] text-muted-foreground">{fmt(ind.total_fechamentos)} fechados</div>
                        </div>
                      </div>
                    ))}
                    {data.ranking_indicadores.length === 0 && (
                      <div className="text-center text-muted-foreground text-xs py-8">Sem dados no periodo</div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* Secao 4 - Por Cidade */}
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Por Cidade (Top 15)</h2>
              <Card className="shadow-sm">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border bg-muted/40">
                          {["Cidade", "Consultores", "Leads", "Fechamentos", "Conversao"].map((h) => (
                            <th key={h} className="text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-4 py-3">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {data.por_cidade.length === 0 && (
                          <tr><td colSpan={5} className="text-center text-muted-foreground text-sm py-10">Sem dados</td></tr>
                        )}
                        {data.por_cidade.map((row, i) => {
                          const taxa = row.total_leads > 0 ? Math.round((row.total_fechamentos / row.total_leads) * 100) : 0;
                          return (
                            <tr key={row.cidade} className={cn("border-b border-border hover:bg-accent/40 transition-colors", i % 2 !== 0 && "bg-muted/20")}>
                              <td className="px-4 py-3 text-sm font-medium text-foreground">{row.cidade}</td>
                              <td className="px-4 py-3 text-sm text-muted-foreground">{fmt(row.total_consultores)}</td>
                              <td className="px-4 py-3 text-sm text-muted-foreground">{fmt(row.total_leads)}</td>
                              <td className="px-4 py-3 text-sm font-bold text-emerald-400">{fmt(row.total_fechamentos)}</td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden max-w-[60px]">
                                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${taxa}%` }} />
                                  </div>
                                  <span className="text-xs text-muted-foreground">{taxa}%</span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Secao 5 - Evolucao Mensal */}
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Evolucao Mensal (ultimos 6 meses)</h2>
              <Card className="shadow-sm">
                <CardContent className="p-0">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border bg-muted/40">
                        {["Mes", "Leads", "Fechamentos", "Conversao", "Progresso Leads", "Progresso Fechamentos"].map((h) => (
                          <th key={h} className="text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-4 py-3">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.evolucao_mensal.length === 0 && (
                        <tr><td colSpan={6} className="text-center text-muted-foreground text-sm py-10">Sem dados</td></tr>
                      )}
                      {(() => {
                        const maxLeads = Math.max(...data.evolucao_mensal.map((m) => m.leads), 1);
                        const maxFech = Math.max(...data.evolucao_mensal.map((m) => m.fechamentos), 1);
                        return data.evolucao_mensal.map((row, i) => {
                          const taxa = row.leads > 0 ? Math.round((row.fechamentos / row.leads) * 100) : 0;
                          const pctLeads = Math.round((row.leads / maxLeads) * 100);
                          const pctFech = Math.round((row.fechamentos / maxFech) * 100);
                          return (
                            <tr key={row.mes} className={cn("border-b border-border hover:bg-accent/40 transition-colors", i % 2 !== 0 && "bg-muted/20")}>
                              <td className="px-4 py-3 text-sm font-medium text-foreground">{row.mes}</td>
                              <td className="px-4 py-3 text-sm text-blue-400 font-medium">{fmt(row.leads)}</td>
                              <td className="px-4 py-3 text-sm text-emerald-400 font-bold">{fmt(row.fechamentos)}</td>
                              <td className="px-4 py-3 text-xs text-muted-foreground">{taxa}%</td>
                              <td className="px-4 py-3">
                                <div className="h-4 bg-muted rounded overflow-hidden max-w-[120px]">
                                  <div className="h-full bg-blue-500/70 rounded transition-all" style={{ width: `${pctLeads}%` }} />
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="h-4 bg-muted rounded overflow-hidden max-w-[120px]">
                                  <div className="h-full bg-emerald-500/70 rounded transition-all" style={{ width: `${pctFech}%` }} />
                                </div>
                              </td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
