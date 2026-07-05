export const dynamic = "force-dynamic";
import { getConsultorLogado } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default async function ConsultorLeadsPage() {
  const consultor = await getConsultorLogado();
  if (!consultor) redirect("/consultor/login");

  const { data: leads } = await supabaseAdmin
    .from("indicacoes")
    .select("id, nome_lead, telefone_lead, status, criado_em, indicadores(nome)")
    .eq("consultor_id", consultor.id)
    .order("criado_em", { ascending: false });

  const statusStyle: Record<string, string> = {
    novo: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    contato: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    fechado: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    perdido: "bg-red-500/10 text-red-600 dark:text-red-400",
  };

  const contagem = { novo: 0, contato: 0, fechado: 0, perdido: 0 };
  leads?.forEach((l) => { if (l.status in contagem) (contagem as any)[l.status]++; });

  return (
    <div className="flex-1 flex flex-col">
      <div className="px-8 py-5 border-b border-border">
        <h1 className="text-base font-bold text-foreground">Meus Leads</h1>
        <p className="text-[11px] text-muted-foreground mt-0.5">Todas as indicacoes recebidas</p>
      </div>
      <div className="flex-1 p-8 bg-muted/30">
        {/* Resumo por status */}
        <div className="flex gap-3 mb-6">
          {Object.entries(contagem).map(([status, qtd]) => (
            <div key={status} className={cn("px-3 py-1.5 rounded-full text-xs font-semibold", statusStyle[status])}>
              {status}: {qtd}
            </div>
          ))}
        </div>

        <Card className="shadow-sm">
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle className="text-sm font-semibold">Historico Completo</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {!leads?.length ? (
              <div className="text-center text-muted-foreground text-sm py-16">Nenhum lead ainda</div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    {["Nome", "Telefone", "Indicado por", "Status", "Data"].map((h) => (
                      <th key={h} className="text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-6 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead, i) => (
                    <tr key={lead.id} className={cn("border-b border-border hover:bg-accent/40 transition-colors", i % 2 !== 0 && "bg-muted/20")}>
                      <td className="px-6 py-3.5 text-sm font-medium text-foreground">{lead.nome_lead}</td>
                      <td className="px-6 py-3.5 text-sm text-muted-foreground font-mono">{lead.telefone_lead}</td>
                      <td className="px-6 py-3.5 text-sm text-muted-foreground">{(lead.indicadores as any)?.nome ?? <span className="italic text-muted-foreground/50">direto</span>}</td>
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
