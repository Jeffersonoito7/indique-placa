export const dynamic = "force-dynamic";
import { getGestorLogado } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, ClipboardList, CheckCircle2, TrendingUp, AlertCircle, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

export default async function GestorDashboard() {
  const gestor = await getGestorLogado();
  if (!gestor) redirect("/gestor/login");

  const { data: consultores } = await supabaseAdmin
    .from("consultores")
    .select("id, nome, email, fone, status, plano")
    .eq("gestor_id", gestor.id)
    .order("nome");

  const consultoresLista = consultores ?? [];
  const ids = consultoresLista.map((c) => c.id);

  let indicacoes: Array<{ consultor_id: string; status: string }> = [];
  if (ids.length > 0) {
    const { data } = await supabaseAdmin
      .from("indicacoes")
      .select("consultor_id, status")
      .in("consultor_id", ids);
    indicacoes = data ?? [];
  }

  const contagemMap: Record<string, { leads: number; fechados: number }> = {};
  for (const ind of indicacoes) {
    if (!contagemMap[ind.consultor_id]) contagemMap[ind.consultor_id] = { leads: 0, fechados: 0 };
    contagemMap[ind.consultor_id].leads++;
    if (ind.status === "fechado") contagemMap[ind.consultor_id].fechados++;
  }

  const total_consultores = consultoresLista.length;
  const total_leads = indicacoes.length;
  const total_fechamentos = indicacoes.filter((i) => i.status === "fechado").length;
  const taxa = total_leads > 0 ? Math.round((total_fechamentos / total_leads) * 100) : 0;

  const ranking = consultoresLista
    .map((c) => {
      const cnt = contagemMap[c.id] ?? { leads: 0, fechados: 0 };
      return {
        ...c,
        leads: cnt.leads,
        fechados: cnt.fechados,
        taxa: cnt.leads > 0 ? Math.round((cnt.fechados / cnt.leads) * 100) : 0,
      };
    })
    .sort((a, b) => b.fechados - a.fechados || b.leads - a.leads);

  const semLeads = ranking.filter((c) => c.leads === 0);

  return (
    <div className="flex-1 flex flex-col">
      <div className="px-8 py-5 border-b border-border">
        <h1 className="text-base font-bold text-foreground">Ola, {gestor.nome.split(" ")[0]}</h1>
        <div className="flex items-center gap-3 mt-0.5">
          <p className="text-[11px] text-muted-foreground">Lider de equipe</p>
          {gestor.fone && (
            <>
              <span className="text-[11px] text-muted-foreground/40">|</span>
              <span className="text-[11px] text-muted-foreground font-mono">{gestor.fone}</span>
            </>
          )}
          <span className="text-[11px] text-muted-foreground/40">|</span>
          <span className={cn(
            "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider",
            gestor.plano === "pro"
              ? "bg-indigo-500/15 text-indigo-400 border border-indigo-500/30"
              : "bg-muted text-muted-foreground border border-border"
          )}>
            {gestor.plano === "pro" ? "Pro" : "Free"}
          </span>
        </div>
      </div>

      <div className="flex-1 p-8 bg-muted/30 space-y-6">

        {/* KPIs */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Consultores no time", value: total_consultores, icon: Users, iconBg: "bg-indigo-500/10", iconColor: "text-indigo-500", valueColor: "text-indigo-500", border: "border-t-indigo-500" },
            { label: "Total de leads", value: total_leads, icon: ClipboardList, iconBg: "bg-blue-500/10", iconColor: "text-blue-500", valueColor: "text-blue-500", border: "border-t-blue-500" },
            { label: "Fechamentos do time", value: total_fechamentos, icon: CheckCircle2, iconBg: "bg-emerald-500/10", iconColor: "text-emerald-500", valueColor: "text-emerald-500", border: "border-t-emerald-500" },
            { label: "Taxa do time", value: `${taxa}%`, icon: TrendingUp, iconBg: "bg-amber-500/10", iconColor: "text-amber-500", valueColor: "text-amber-500", border: "border-t-amber-500" },
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

        {/* Alerta consultores sem leads */}
        {semLeads.length > 0 && (
          <div className="rounded-2xl p-4 bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-bold text-amber-500 leading-tight">
                {semLeads.length} consultor(es) sem nenhum lead
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {semLeads.map((c) => c.nome).join(", ")}
              </div>
            </div>
          </div>
        )}

        {/* Ranking */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-500" />
              Ranking da Equipe
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {ranking.length === 0 ? (
              <div className="text-center text-muted-foreground text-sm py-10">
                Nenhum consultor no time ainda. Adicione consultores em Meu Time.
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    {["#", "Consultor", "Plano", "Status", "Leads", "Fechamentos", "Taxa"].map((h) => (
                      <th key={h} className="text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-5 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ranking.map((c, i) => (
                    <tr key={c.id} className={cn(
                      "border-b border-border transition-colors hover:bg-accent/40",
                      i % 2 !== 0 && "bg-muted/20"
                    )}>
                      <td className="px-5 py-3.5">
                        <span className={cn(
                          "text-sm font-bold",
                          i === 0 ? "text-amber-500" : i === 1 ? "text-slate-400" : i === 2 ? "text-orange-600" : "text-muted-foreground"
                        )}>#{i + 1}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="text-sm font-semibold text-foreground">{c.nome}</div>
                        <div className="text-[11px] text-muted-foreground">{c.email}</div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={cn(
                          "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider",
                          c.plano === "pro"
                            ? "bg-indigo-500/15 text-indigo-400 border border-indigo-500/30"
                            : "bg-muted text-muted-foreground border border-border"
                        )}>
                          {c.plano ?? "free"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={cn(
                          "text-[10px] font-semibold px-2.5 py-1 rounded-full",
                          c.status === "ativo"
                            ? "bg-emerald-500/10 text-emerald-500"
                            : "bg-red-500/10 text-red-500"
                        )}>
                          {c.status === "ativo" ? "Ativo" : "Inativo"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-muted-foreground">{c.leads}</td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm font-bold text-emerald-500">{c.fechados}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-14 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${c.taxa}%` }} />
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
