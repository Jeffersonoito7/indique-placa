export const dynamic = "force-dynamic";
import { supabaseAdmin } from "@/lib/supabase-server";
import { PlacaMercosul } from "@/components/placa-mercosul";
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
    supabaseAdmin.from("consultores").select("id", { count: "exact", head: true }).eq("status", "ativo"),
    supabaseAdmin.from("indicadores").select("id", { count: "exact", head: true }),
    supabaseAdmin.from("indicacoes").select("id", { count: "exact", head: true }),
    supabaseAdmin.from("indicacoes").select("id", { count: "exact", head: true }).eq("status", "fechado"),
    // ultimos 30 dias
    supabaseAdmin.from("consultores").select("id", { count: "exact", head: true }).eq("status", "ativo").gte("created_at", inicio30),
    supabaseAdmin.from("consultores").select("id", { count: "exact", head: true }).eq("status", "ativo").gte("created_at", inicio60).lt("created_at", inicio30),
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

function BannerMetric({
  title, value, trend, icon: Icon, iconColor, valueColor,
}: {
  title: string; value: string | number;
  trend?: { texto: string; positivo: boolean } | null;
  icon: React.ElementType; iconColor: string; valueColor: string;
  iconBg: string; borderColor: string; sub: string;
}) {
  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-3"
      style={{
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.08)",
        backdropFilter: "blur(8px)",
      }}
    >
      <div className="flex items-center justify-between">
        <Icon className={cn("h-4 w-4", iconColor)} style={{ opacity: 0.8 }} />
        {trend && (
          <span
            className="text-[10px] font-bold flex items-center gap-1 px-2 py-0.5 rounded-full"
            style={{
              background: trend.positivo ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
              color: trend.positivo ? "#34d399" : "#f87171",
            }}
          >
            {trend.positivo ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {trend.texto}
          </span>
        )}
      </div>
      <div>
        <div className={cn("text-3xl font-extrabold tracking-tight", valueColor)}>{value}</div>
        <div className="text-[11px] font-medium mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>
          {title}
        </div>
      </div>
    </div>
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
      {/* Banner */}
      <div
        className="relative overflow-hidden px-8 py-8"
        style={{
          background: "linear-gradient(135deg, #0c1929 0%, #0a2240 40%, #062d1a 100%)",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 60% 80% at 80% 50%, rgba(16,185,129,0.08) 0%, transparent 70%)",
          }}
        />
        <div className="relative">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight">Dashboard</h1>
              <p className="text-sm text-white/50 mt-1">Visão geral da plataforma em tempo real</p>
            </div>
            <div
              className="flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full"
              style={{
                background: "rgba(16,185,129,0.12)",
                border: "1px solid rgba(16,185,129,0.25)",
                color: "#34d399",
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              AO VIVO
            </div>
          </div>

          {/* Mini metricas no banner */}
          <div className="grid grid-cols-4 gap-4 mt-6">
            {metrics.map((m) => (
              <BannerMetric key={m.title} {...m} />
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 p-8 bg-muted/30">
        <Card className="shadow-sm">
          <CardHeader className="pb-3 border-b border-border">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Últimos Leads</CardTitle>
              <Badge variant="secondary" className="text-[10px]">últimos 10</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  {["Placa", "Proprietário", "Consultor", "Status", "Data"].map((h) => (
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
    .select("id, placa, nome_lead, status, criado_em, consultores(nome)")
    .order("criado_em", { ascending: false })
    .limit(10);

  if (!leads?.length) {
    return (
      <tr>
        <td colSpan={6} className="text-center text-muted-foreground text-sm py-10">
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
          <td className="px-6 py-3">
            {(lead as any).placa
              ? <PlacaMercosul placa={(lead as any).placa} tamanho="sm" />
              : <span className="text-xs text-muted-foreground italic">sem placa</span>}
          </td>
          <td className="px-6 py-3.5 text-sm text-foreground">{lead.nome_lead ?? <span className="italic text-muted-foreground/50 text-xs">a preencher</span>}</td>
          <td className="px-6 py-3.5 text-sm text-muted-foreground">{(lead.consultores as any)?.nome ?? "-"}</td>
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
