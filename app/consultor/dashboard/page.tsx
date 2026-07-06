export const dynamic = "force-dynamic";
import { getConsultorLogado } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList, UserCheck, CheckCircle2, TrendingUp, Trophy, Star, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { PlacaMercosul } from "@/components/placa-mercosul";

function moeda(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function ConsultorDashboard() {
  const consultor = await getConsultorLogado();
  if (!consultor) redirect("/consultor/login");

  const [leadsRes, indicadoresRes, { data: config }] = await Promise.all([
    supabaseAdmin
      .from("indicacoes")
      .select("id, placa, nome_lead, status, criado_em, indicador_id, indicadores(id, nome)")
      .eq("consultor_id", consultor.id)
      .order("criado_em", { ascending: false }),
    supabaseAdmin
      .from("indicadores")
      .select("id, nome, criado_em")
      .eq("consultor_id", consultor.id)
      .order("criado_em", { ascending: false }),
    supabaseAdmin.from("configuracoes").select("comissao_indicador").limit(1).single(),
  ]);

  const leads = leadsRes.data ?? [];
  const indicadores = indicadoresRes.data ?? [];
  const comissaoIndicador: number = (config as any)?.comissao_indicador ?? 20;

  const totalLeads = leads.length;
  const totalFechados = leads.filter((l) => l.status === "fechado").length;
  const taxa = totalLeads > 0 ? Math.round((totalFechados / totalLeads) * 100) : 0;
  const totalIndicadores = indicadores.length;

  // Ranking de indicadores
  const rankMap: Record<string, { id: string; nome: string; total: number; fechados: number; em_aberto: number }> = {};
  for (const lead of leads) {
    const ind = lead.indicadores as any;
    if (!ind?.id) continue;
    if (!rankMap[ind.id]) rankMap[ind.id] = { id: ind.id, nome: ind.nome, total: 0, fechados: 0, em_aberto: 0 };
    rankMap[ind.id].total++;
    if (lead.status === "fechado") rankMap[ind.id].fechados++;
    if (lead.status === "novo" || lead.status === "contato") rankMap[ind.id].em_aberto++;
  }

  const ranking = Object.values(rankMap)
    .map((r) => ({
      ...r,
      taxa: r.total > 0 ? Math.round((r.fechados / r.total) * 100) : 0,
      comissaoDevida: r.fechados * comissaoIndicador,
    }))
    .sort((a, b) => b.fechados - a.fechados || b.total - a.total);

  // Indicadores sem nenhuma indicacao
  const idsComLead = new Set(Object.keys(rankMap));
  const semIndicacao = indicadores.filter((i) => !idsComLead.has(i.id));

  const ultimasPlacas = leads.slice(0, 6);

  const statusStyle: Record<string, string> = {
    novo: "bg-blue-500/10 text-blue-500",
    contato: "bg-amber-500/10 text-amber-500",
    fechado: "bg-emerald-500/10 text-emerald-500",
    perdido: "bg-red-500/10 text-red-500",
  };

  const statusLabel: Record<string, string> = {
    novo: "Novo",
    contato: "Em contato",
    fechado: "Fechado",
    perdido: "Perdido",
  };

  return (
    <div className="flex-1 flex flex-col">
      <div className="px-8 py-5 border-b border-border">
        <h1 className="text-base font-bold text-foreground">Olá, {consultor.nome.split(" ")[0]}</h1>
        <div className="flex items-center gap-3 mt-0.5">
          <p className="text-[11px] text-muted-foreground">Painel de desempenho</p>
          <span className="text-[11px] text-muted-foreground/40">|</span>
          <span className="text-[11px] text-muted-foreground font-mono">{consultor.fone}</span>
        </div>
      </div>

      <div className="flex-1 p-8 bg-muted/30 space-y-6">

        {/* KPIs */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Placas recebidas", value: totalLeads, icon: ClipboardList, iconBg: "bg-blue-500/10", iconColor: "text-blue-500", valueColor: "text-blue-500", border: "border-t-blue-500" },
            { label: "Indicadores ativos", value: totalIndicadores, icon: UserCheck, iconBg: "bg-violet-500/10", iconColor: "text-violet-500", valueColor: "text-violet-500", border: "border-t-violet-500" },
            { label: "Vendas fechadas", value: totalFechados, icon: CheckCircle2, iconBg: "bg-emerald-500/10", iconColor: "text-emerald-500", valueColor: "text-emerald-500", border: "border-t-emerald-500" },
            { label: "Taxa de conversão", value: `${taxa}%`, icon: TrendingUp, iconBg: "bg-amber-500/10", iconColor: "text-amber-500", valueColor: "text-amber-500", border: "border-t-amber-500" },
          ].map((m) => {
            const Icon = m.icon;
            return (
              <Card key={m.label} className={cn("border-t-4 shadow-sm", m.border)}>
                <CardContent className="p-5">
                  <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center mb-3", m.iconBg)}>
                    <Icon className={cn("h-4 w-4", m.iconColor)} />
                  </div>
                  <div className={cn("text-2xl font-bold tracking-tight mb-0.5", m.valueColor)}>{m.value}</div>
                  <p className="text-[11px] text-muted-foreground">{m.label}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Ranking de indicadores */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3 border-b border-border">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Trophy className="h-4 w-4 text-amber-500" />
                Desempenho dos Indicadores
              </CardTitle>
              <span className="text-[10px] text-muted-foreground">Comissao: {moeda(comissaoIndicador)} por fechamento</span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {ranking.length === 0 ? (
              <div className="text-center text-muted-foreground text-sm py-10">Nenhum indicador enviou placas ainda</div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    {["#", "Indicador", "Indicadas", "Fechadas", "Em aberto", "Taxa", "Comissão devida", ""].map((h) => (
                      <th key={h} className="text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-5 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ranking.map((ind, i) => {
                    const destaque = i === 0 && ind.fechados > 0;
                    return (
                      <tr key={ind.id} className={cn(
                        "border-b border-border transition-colors",
                        destaque ? "bg-amber-500/5 hover:bg-amber-500/10" : "hover:bg-accent/40",
                        i % 2 !== 0 && !destaque && "bg-muted/20"
                      )}>
                        <td className="px-5 py-3.5">
                          <span className={cn("text-sm font-bold", i === 0 ? "text-amber-500" : i === 1 ? "text-slate-400" : i === 2 ? "text-orange-600" : "text-muted-foreground")}>
                            #{i + 1}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-foreground">{ind.nome}</span>
                            {destaque && <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />}
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-muted-foreground">{ind.total}</td>
                        <td className="px-5 py-3.5">
                          <span className="text-sm font-bold text-emerald-500">{ind.fechados}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-sm text-blue-500">{ind.em_aberto}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="w-14 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${ind.taxa}%` }} />
                            </div>
                            <span className="text-xs text-muted-foreground">{ind.taxa}%</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={cn(
                            "text-sm font-bold",
                            ind.comissaoDevida > 0 ? "text-emerald-500" : "text-muted-foreground"
                          )}>
                            {moeda(ind.comissaoDevida)}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          {destaque && (
                            <span className="text-[9px] font-bold px-2 py-1 rounded-full bg-amber-500/15 text-amber-500 uppercase tracking-wider">
                              Recompensar
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        {/* Indicadores sem nenhuma indicacao */}
        {semIndicacao.length > 0 && (
          <Card className="shadow-sm border-amber-500/20">
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                Indicadores sem atividade ({semIndicacao.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-3">Estes indicadores ainda nao enviaram nenhuma placa. Vale entrar em contato.</p>
              <div className="flex flex-wrap gap-2">
                {semIndicacao.map((ind) => (
                  <span key={ind.id} className="text-xs font-medium px-3 py-1.5 rounded-full bg-muted border border-border text-foreground">
                    {ind.nome}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Ultimas placas */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle className="text-sm font-semibold">Últimas Placas Recebidas</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {!ultimasPlacas.length ? (
              <div className="text-center text-muted-foreground text-sm py-12">
                Nenhuma placa ainda. Compartilhe seu link de indicação!
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    {["Placa", "Proprietário", "Via", "Status", "Data"].map((h) => (
                      <th key={h} className="text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-6 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ultimasPlacas.map((lead, i) => (
                    <tr key={lead.id} className={cn("border-b border-border hover:bg-accent/40 transition-colors", i % 2 !== 0 && "bg-muted/20")}>
                      <td className="px-6 py-3">
                        {(lead as any).placa
                          ? <PlacaMercosul placa={(lead as any).placa} tamanho="sm" />
                          : <span className="text-xs text-muted-foreground italic">sem placa</span>}
                      </td>
                      <td className="px-6 py-3.5 text-sm text-foreground">
                        {lead.nome_lead ?? <span className="italic text-muted-foreground/50 text-xs">a preencher</span>}
                      </td>
                      <td className="px-6 py-3.5 text-sm text-muted-foreground">
                        {(lead.indicadores as any)?.nome ?? <span className="italic text-muted-foreground/50">direto</span>}
                      </td>
                      <td className="px-6 py-3.5">
                        <span className={cn("text-[11px] font-semibold px-2.5 py-1 rounded-full", statusStyle[lead.status] ?? "bg-muted text-muted-foreground")}>
                          {statusLabel[lead.status] ?? lead.status}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-xs text-muted-foreground">
                        {new Date(lead.criado_em).toLocaleDateString("pt-BR")}
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
