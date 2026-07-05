export const dynamic = "force-dynamic";
import { supabaseAdmin } from "@/lib/supabase-server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList, Flame, CheckCircle2, XCircle, PhoneCall } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusLead } from "@/components/status-lead";

async function getLeads() {
  const { data, count } = await supabaseAdmin
    .from("indicacoes")
    .select("id, nome_lead, telefone_lead, status, criado_em, consultores(nome)", { count: "exact" })
    .order("criado_em", { ascending: false });

  const novos = data?.filter((l) => l.status === "novo").length ?? 0;
  const contato = data?.filter((l) => l.status === "contato").length ?? 0;
  const fechados = data?.filter((l) => l.status === "fechado").length ?? 0;
  const perdidos = data?.filter((l) => l.status === "perdido").length ?? 0;

  return { lista: data ?? [], total: count ?? 0, novos, contato, fechados, perdidos };
}

const statusStyle: Record<string, string> = {
  novo: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  contato: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  fechado: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  perdido: "bg-red-500/10 text-red-600 dark:text-red-400",
};

export default async function LeadsPage() {
  const { lista, total, novos, contato, fechados, perdidos } = await getLeads();

  const cards = [
    { label: "Total de Leads", value: total, icon: ClipboardList, iconBg: "bg-blue-500/10", iconColor: "text-blue-500", valueColor: "text-blue-500", border: "border-t-blue-500" },
    { label: "Novos", value: novos, icon: Flame, iconBg: "bg-sky-500/10", iconColor: "text-sky-500", valueColor: "text-sky-500", border: "border-t-sky-500" },
    { label: "Em Contato", value: contato, icon: PhoneCall, iconBg: "bg-amber-500/10", iconColor: "text-amber-500", valueColor: "text-amber-500", border: "border-t-amber-500" },
    { label: "Fechados", value: fechados, icon: CheckCircle2, iconBg: "bg-emerald-500/10", iconColor: "text-emerald-500", valueColor: "text-emerald-500", border: "border-t-emerald-500" },
    { label: "Perdidos", value: perdidos, icon: XCircle, iconBg: "bg-red-500/10", iconColor: "text-red-500", valueColor: "text-red-500", border: "border-t-red-500" },
  ];

  return (
    <div className="flex-1 flex flex-col">
      <div className="px-8 py-5 border-b border-border">
        <h1 className="text-base font-bold text-foreground">Leads</h1>
        <p className="text-[11px] text-muted-foreground mt-0.5">Indicacoes recebidas por todos os consultores</p>
      </div>

      <div className="flex-1 p-8 bg-muted/30">
        {/* Resumo */}
        <div className="grid grid-cols-5 gap-4 mb-8">
          {cards.map((c) => {
            const Icon = c.icon;
            return (
              <Card key={c.label} className={cn("border-t-4", c.border)}>
                <CardContent className="p-5 flex items-center gap-3">
                  <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0", c.iconBg)}>
                    <Icon className={cn("h-4 w-4", c.iconColor)} />
                  </div>
                  <div>
                    <div className={cn("text-xl font-bold", c.valueColor)}>{c.value}</div>
                    <div className="text-[10px] text-muted-foreground leading-tight">{c.label}</div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Tabela */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle className="text-sm font-semibold">Todos os Leads</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {lista.length === 0 ? (
              <div className="text-center text-muted-foreground text-sm py-16">Nenhum lead ainda</div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    {["Nome", "Telefone", "Consultor", "Status", "Data"].map((h) => (
                      <th key={h} className="text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-6 py-3">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {lista.map((lead, i) => (
                    <tr key={lead.id} className={cn("border-b border-border hover:bg-accent/40 transition-colors", i % 2 !== 0 && "bg-muted/20")}>
                      <td className="px-6 py-3.5 text-sm font-medium text-foreground">{lead.nome_lead}</td>
                      <td className="px-6 py-3.5 text-sm text-muted-foreground font-mono">{lead.telefone_lead}</td>
                      <td className="px-6 py-3.5 text-sm text-muted-foreground">{(lead.consultores as any)?.nome ?? "-"}</td>
                      <td className="px-6 py-3.5">
                        <StatusLead leadId={lead.id} statusInicial={lead.status as any} endpoint="/api/master/lead" />
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
