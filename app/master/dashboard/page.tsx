export const dynamic = "force-dynamic";
import { supabaseAdmin } from "@/lib/supabase-server";
import { TrendingUp, TrendingDown, Users, UserCheck, ClipboardList, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

function periodos() {
  const agora = new Date();
  const inicio30 = new Date(agora.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const inicio60 = new Date(agora.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString();
  return { inicio30, inicio60, agora: agora.toISOString() };
}

function calcTrend(atual: number, anterior: number): { texto: string; positivo: boolean } | null {
  if (anterior === 0) return null;
  const pct = ((atual - anterior) / anterior) * 100;
  const sinal = pct >= 0 ? "+" : "";
  return { texto: `${sinal}${pct.toFixed(1)}%`, positivo: pct >= 0 };
}

async function getDashboardData() {
  const { inicio30, inicio60, agora } = periodos();

  const [
    consultoresTotal,
    indicadoresTotal,
    leadsTotal,
    fechamentosTotal,
    consultores30,
    consultoresPrev,
    indicadores30,
    indicadoresPrev,
    leads30,
    leadsPrev,
    fechamentos30,
    fechamentosPrev,
  ] = await Promise.all([
    supabaseAdmin.from("consultores").select("id", { count: "exact", head: true }),
    supabaseAdmin.from("indicadores").select("id", { count: "exact", head: true }),
    supabaseAdmin.from("indicacoes").select("id", { count: "exact", head: true }),
    supabaseAdmin.from("indicacoes").select("id", { count: "exact", head: true }).eq("status", "fechado"),
    // ultimos 30 dias
    supabaseAdmin.from("consultores").select("id", { count: "exact", head: true }).gte("criado_em", inicio30),
    supabaseAdmin.from("consultores").select("id", { count: "exact", head: true }).gte("criado_em", inicio60).lt("criado_em", inicio30),
    supabaseAdmin.from("indicadores").select("id", { count: "exact", head: true }).gte("criado_em", inicio30),
    supabaseAdmin.from("indicadores").select("id", { count: "exact", head: true }).gte("criado_em", inicio60).lt("criado_em", inicio30),
    supabaseAdmin.from("indicacoes").select("id", { count: "exact", head: true }).gte("criado_em", inicio30),
    supabaseAdmin.from("indicacoes").select("id", { count: "exact", head: true }).gte("criado_em", inicio60).lt("criado_em", inicio30),
    supabaseAdmin.from("indicacoes").select("id", { count: "exact", head: true }).eq("status", "fechado").gte("criado_em", inicio30),
    supabaseAdmin.from("indicacoes").select("id", { count: "exact", head: true }).eq("status", "fechado").gte("criado_em", inicio60).lt("criado_em", inicio30),
  ]);

  return {
    totalConsultores: consultoresTotal.count ?? 0,
    totalIndicadores: indicadoresTotal.count ?? 0,
    totalLeads: leadsTotal.count ?? 0,
    totalFechamentos: fechamentosTotal.count ?? 0,
    trendConsultores: calcTrend(consultores30.count ?? 0, consultoresPrev.count ?? 0),
    trendIndicadores: calcTrend(indicadores30.count ?? 0, indicadoresPrev.count ?? 0),
    trendLeads: calcTrend(leads30.count ?? 0, leadsPrev.count ?? 0),
    trendFechamentos: calcTrend(fechamentos30.count ?? 0, fechamentosPrev.count ?? 0),
  };
}

function MetricCard({
  title, value, sub, trend, icon: Icon, iconBg, iconColor, valueColor, borderColor,
}: {
  title: string; value: string | number; sub: string;
  trend?: { texto: string; positivo: boolean } | null;
  icon: React.ElementType; iconBg: string; iconColor: string; valueColor: string; borderColor: string;
}) {
  return (
    <Card className={cn("border-t-4 shadow-sm", borderColor)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", iconBg)}>
            <Icon className={cn("h-5 w-5", iconColor)} />
          </div>
          {trend && (
            <Badge className={cn(
              "text-[10px] px-2 py-0.5 font-semibold border-0",
              trend.positivo ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
            )}>
              {trend.positivo
                ? <TrendingUp className="h-3 w-3 mr-1 inline" />
                : <TrendingDown className="h-3 w-3 mr-1 inline" />}
              {trend.texto}
            </Badge>
          )}
        </div>
        <div className={cn("text-3xl font-bold tracking-tight mb-1", valueColor)}>{value}</div>
        <p className="text-xs font-medium text-muted-foreground">{title}</p>
        <p className="text-[11px] text-muted-foreground/60 mt-0.5">{sub}</p>
      </CardContent>
    </Card>
  );
}

export default async function DashboardPage() {
  const data = await getDashboardData();

  const metrics = [
    {
      title: "Consultores Ativos",
      value: data.totalConsultores.toLocaleString("pt-BR"),
      sub: "vs. 30 dias anteriores",
      trend: data.trendConsultores,
      icon: Users,
      iconBg: "bg-blue-500/10", iconColor: "text-blue-500",
      valueColor: "text-blue-500", borderColor: "border-t-blue-500",
    },
    {
      title: "Indicadores",
      value: data.totalIndicadores.toLocaleString("pt-BR"),
      sub: "vs. 30 dias anteriores",
      trend: data.trendIndicadores,
      icon: UserCheck,
      iconBg: "bg-violet-500/10", iconColor: "text-violet-500",
      valueColor: "text-violet-500", borderColor: "border-t-violet-500",
    },
    {
      title: "Leads Recebidos",
      value: data.totalLeads.toLocaleString("pt-BR"),
      sub: "vs. 30 dias anteriores",
      trend: data.trendLeads,
      icon: ClipboardList,
      iconBg: "bg-amber-500/10", iconColor: "text-amber-500",
      valueColor: "text-amber-500", borderColor: "border-t-amber-500",
    },
    {
      title: "Vendas Fechadas",
      value: data.totalFechamentos.toLocaleString("pt-BR"),
      sub: "vs. 30 dias anteriores",
      trend: data.trendFechamentos,
      icon: DollarSign,
      iconBg: "bg-emerald-500/10", iconColor: "text-emerald-500",
      valueColor: "text-emerald-500", borderColor: "border-t-emerald-500",
    },
  ];

  return (
    <div className="flex-1 flex flex-col">
      <div className="px-8 py-5 border-b border-border flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-foreground">Dashboard</h1>
          <p className="text-[11px] text-muted-foreground mt-0.5">Visao geral da plataforma em tempo real</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-500">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          AO VIVO
        </div>
      </div>

      <div className="flex-1 p-8 bg-muted/30">
        <div className="grid grid-cols-4 gap-4 mb-8">
          {metrics.map((m) => (
            <MetricCard key={m.title} {...m} />
          ))}
        </div>

        <Card className="shadow-sm">
          <CardHeader className="pb-3 border-b border-border">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Ultimos Leads</CardTitle>
              <Badge variant="secondary" className="text-[10px]">ultimos 10</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  {["Nome", "Consultor", "Telefone", "Status", "Data"].map((h) => (
                    <th key={h} className="text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-6 py-3">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <RecentLeadsTable />
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

async function RecentLeadsTable() {
  const { data: leads } = await supabaseAdmin
    .from("indicacoes")
    .select("id, nome_lead, telefone_lead, status, criado_em, consultores(nome)")
    .order("criado_em", { ascending: false })
    .limit(10);

  if (!leads?.length) {
    return (
      <tr>
        <td colSpan={5} className="text-center text-muted-foreground text-sm py-10">
          Nenhum lead ainda
        </td>
      </tr>
    );
  }

  const statusStyle: Record<string, string> = {
    novo: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    contato: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    fechado: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    perdido: "bg-red-500/10 text-red-600 dark:text-red-400",
  };

  return (
    <>
      {leads.map((lead, i) => (
        <tr key={lead.id} className={cn("border-b border-border hover:bg-accent/40 transition-colors", i % 2 === 0 ? "" : "bg-muted/20")}>
          <td className="px-6 py-3.5 text-sm font-medium text-foreground">{lead.nome_lead}</td>
          <td className="px-6 py-3.5 text-sm text-muted-foreground">{(lead.consultores as any)?.nome ?? "-"}</td>
          <td className="px-6 py-3.5 text-sm text-muted-foreground font-mono">{lead.telefone_lead}</td>
          <td className="px-6 py-3.5">
            <span className={cn("text-[11px] font-semibold px-2.5 py-1 rounded-full", statusStyle[lead.status] ?? "bg-muted text-muted-foreground")}>
              {lead.status}
            </span>
          </td>
          <td className="px-6 py-3.5 text-xs text-muted-foreground">
            {new Date(lead.criado_em).toLocaleDateString("pt-BR")}
          </td>
        </tr>
      ))}
    </>
  );
}
