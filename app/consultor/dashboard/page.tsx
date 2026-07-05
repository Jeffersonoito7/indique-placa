export const dynamic = "force-dynamic";
import { getConsultorLogado } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, UserCheck, CheckCircle2, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

export default async function ConsultorDashboard() {
  const consultor = await getConsultorLogado();
  if (!consultor) redirect("/consultor/login");

  const [leads, indicadores, fechados] = await Promise.all([
    supabaseAdmin.from("indicacoes").select("id, status, criado_em", { count: "exact" }).eq("consultor_id", consultor.id),
    supabaseAdmin.from("indicadores").select("id", { count: "exact" }).eq("consultor_id", consultor.id),
    supabaseAdmin.from("indicacoes").select("id", { count: "exact" }).eq("consultor_id", consultor.id).eq("status", "fechado"),
  ]);

  const totalLeads = leads.count ?? 0;
  const totalIndicadores = indicadores.count ?? 0;
  const totalFechados = fechados.count ?? 0;
  const taxa = totalLeads > 0 ? Math.round((totalFechados / totalLeads) * 100) : 0;

  const metricas = [
    { label: "Meus Leads", value: totalLeads, icon: ClipboardList, iconBg: "bg-blue-500/10", iconColor: "text-blue-500", valueColor: "text-blue-500", border: "border-t-blue-500" },
    { label: "Indicadores", value: totalIndicadores, icon: UserCheck, iconBg: "bg-violet-500/10", iconColor: "text-violet-500", valueColor: "text-violet-500", border: "border-t-violet-500" },
    { label: "Vendas Fechadas", value: totalFechados, icon: CheckCircle2, iconBg: "bg-emerald-500/10", iconColor: "text-emerald-500", valueColor: "text-emerald-500", border: "border-t-emerald-500" },
    { label: "Taxa de Conversao", value: `${taxa}%`, icon: TrendingUp, iconBg: "bg-amber-500/10", iconColor: "text-amber-500", valueColor: "text-amber-500", border: "border-t-amber-500" },
  ];

  const { data: ultimosLeads } = await supabaseAdmin
    .from("indicacoes")
    .select("id, nome_lead, telefone_lead, status, criado_em")
    .eq("consultor_id", consultor.id)
    .order("criado_em", { ascending: false })
    .limit(8);

  const statusStyle: Record<string, string> = {
    novo: "bg-blue-500/10 text-blue-500",
    contato: "bg-amber-500/10 text-amber-500",
    fechado: "bg-emerald-500/10 text-emerald-500",
    perdido: "bg-red-500/10 text-red-500",
  };

  return (
    <div className="flex-1 flex flex-col">
      <div className="px-8 py-5 border-b border-border">
        <h1 className="text-base font-bold text-foreground">Ola, {consultor.nome.split(" ")[0]}</h1>
        <p className="text-[11px] text-muted-foreground mt-0.5">Seu painel de desempenho</p>
      </div>
      <div className="flex-1 p-8 bg-muted/30">
        <div className="grid grid-cols-4 gap-4 mb-8">
          {metricas.map((m) => {
            const Icon = m.icon;
            return (
              <Card key={m.label} className={cn("border-t-4 shadow-sm", m.border)}>
                <CardContent className="p-6">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-4", m.iconBg)}>
                    <Icon className={cn("h-5 w-5", m.iconColor)} />
                  </div>
                  <div className={cn("text-3xl font-bold tracking-tight mb-1", m.valueColor)}>{m.value}</div>
                  <p className="text-xs text-muted-foreground">{m.label}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="shadow-sm">
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle className="text-sm font-semibold">Ultimos Leads Recebidos</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {!ultimosLeads?.length ? (
              <div className="text-center text-muted-foreground text-sm py-12">Voce ainda nao tem leads. Compartilhe seu link de indicacao!</div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    {["Nome", "Telefone", "Status", "Data"].map((h) => (
                      <th key={h} className="text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-6 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ultimosLeads.map((lead, i) => (
                    <tr key={lead.id} className={cn("border-b border-border hover:bg-accent/40 transition-colors", i % 2 !== 0 && "bg-muted/20")}>
                      <td className="px-6 py-3.5 text-sm font-medium text-foreground">{lead.nome_lead}</td>
                      <td className="px-6 py-3.5 text-sm text-muted-foreground font-mono">{lead.telefone_lead}</td>
                      <td className="px-6 py-3.5">
                        <span className={cn("text-[11px] font-semibold px-2.5 py-1 rounded-full", statusStyle[lead.status] ?? "bg-muted text-muted-foreground")}>{lead.status}</span>
                      </td>
                      <td className="px-6 py-3.5 text-xs text-muted-foreground">{new Date(lead.criado_em).toLocaleDateString("pt-BR")}</td>
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
