export const dynamic = "force-dynamic";
import { supabaseAdmin } from "@/lib/supabase-server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList, Flame, CheckCircle2, XCircle, PhoneCall } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusLead } from "@/components/status-lead";
import { AbrirWhatsApp } from "@/components/abrir-whatsapp";
import { PlacaMercosul } from "@/components/placa-mercosul";

async function getLeads() {
  const { data, count } = await supabaseAdmin
    .from("indicacoes")
    .select("id, placa, nome_lead, telefone_lead, status, criado_em, tipo_veiculo, consultores(nome)", { count: "exact" })
    .order("criado_em", { ascending: false });

  const novos = data?.filter((l) => l.status === "novo").length ?? 0;
  const contato = data?.filter((l) => l.status === "contato").length ?? 0;
  const fechados = data?.filter((l) => l.status === "fechado").length ?? 0;
  const perdidos = data?.filter((l) => l.status === "perdido").length ?? 0;

  return { lista: data ?? [], total: count ?? 0, novos, contato, fechados, perdidos };
}

export default async function LeadsPage() {
  const { lista, total, novos, contato, fechados, perdidos } = await getLeads();

  const cards = [
    { label: "Total", value: total, icon: ClipboardList, iconBg: "bg-blue-500/10", iconColor: "text-blue-500", valueColor: "text-blue-500", border: "border-t-blue-500" },
    { label: "Novos", value: novos, icon: Flame, iconBg: "bg-sky-500/10", iconColor: "text-sky-500", valueColor: "text-sky-500", border: "border-t-sky-500" },
    { label: "Em Contato", value: contato, icon: PhoneCall, iconBg: "bg-amber-500/10", iconColor: "text-amber-500", valueColor: "text-amber-500", border: "border-t-amber-500" },
    { label: "Fechados", value: fechados, icon: CheckCircle2, iconBg: "bg-emerald-500/10", iconColor: "text-emerald-500", valueColor: "text-emerald-500", border: "border-t-emerald-500" },
    { label: "Perdidos", value: perdidos, icon: XCircle, iconBg: "bg-red-500/10", iconColor: "text-red-500", valueColor: "text-red-500", border: "border-t-red-500" },
  ];

  return (
    <div className="flex-1 flex flex-col">
      <div className="px-8 py-5 border-b border-border">
        <h1 className="text-base font-bold text-foreground">Leads</h1>
        <p className="text-[11px] text-muted-foreground mt-0.5">Placas indicadas por todos os consultores</p>
      </div>

      <div className="flex-1 p-8 bg-muted/30">
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

        <Card className="shadow-sm">
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle className="text-sm font-semibold">Todas as Placas</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {lista.length === 0 ? (
              <div className="text-center text-muted-foreground text-sm py-16">Nenhuma indicação ainda</div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    {["Placa", "Tipo", "Proprietário", "Consultor", "Status", "Data", ""].map((h) => (
                      <th key={h} className="text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-6 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {lista.map((lead, i) => (
                    <tr key={lead.id} className={cn("border-b border-border hover:bg-accent/40 transition-colors", i % 2 !== 0 && "bg-muted/20")}>
                      <td className="px-6 py-3">
                        {(lead as any).placa ? (
                          <PlacaMercosul placa={(lead as any).placa} tamanho="sm" />
                        ) : (
                          <span className="text-xs text-muted-foreground italic">sem placa</span>
                        )}
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="text-xs font-medium text-muted-foreground capitalize">{(lead as any).tipo_veiculo ?? "carro"}</span>
                      </td>
                      <td className="px-6 py-3">
                        <div className="text-sm font-medium text-foreground">{lead.nome_lead ?? <span className="italic text-muted-foreground/50 text-xs">a preencher</span>}</div>
                        {lead.telefone_lead && <div className="text-xs text-muted-foreground font-mono mt-0.5">{lead.telefone_lead}</div>}
                      </td>
                      <td className="px-6 py-3.5 text-sm text-muted-foreground">{(lead.consultores as any)?.nome ?? "-"}</td>
                      <td className="px-6 py-3.5">
                        <StatusLead leadId={lead.id} statusInicial={lead.status as any} endpoint="/api/master/lead" />
                      </td>
                      <td className="px-6 py-3.5 text-xs text-muted-foreground">
                        {new Date(lead.criado_em).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="px-6 py-3.5">
                        {lead.telefone_lead && <AbrirWhatsApp telefone={lead.telefone_lead} nome={lead.nome_lead ?? (lead as any).placa ?? ""} />}
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
