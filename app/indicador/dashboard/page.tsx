export const dynamic = "force-dynamic";
import { getIndicadorLogado } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList, CheckCircle2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export default async function IndicadorDashboard() {
  const indicador = await getIndicadorLogado();
  if (!indicador) redirect("/indicador/login");

  const [{ data: leads, count }, { count: countFechados }] = await Promise.all([
    supabaseAdmin
      .from("indicacoes")
      .select("id, nome_lead, status, criado_em", { count: "exact" })
      .eq("indicador_id", indicador.id)
      .order("criado_em", { ascending: false })
      .limit(6),
    supabaseAdmin
      .from("indicacoes")
      .select("id", { count: "exact", head: true })
      .eq("indicador_id", indicador.id)
      .eq("status", "fechado"),
  ]);

  const total = count ?? 0;
  const fechados = countFechados ?? 0;

  const statusStyle: Record<string, string> = {
    novo: "bg-blue-500/10 text-blue-500",
    contato: "bg-amber-500/10 text-amber-500",
    fechado: "bg-emerald-500/10 text-emerald-500",
    perdido: "bg-red-500/10 text-red-500",
  };

  return (
    <div className="flex-1 flex flex-col">
      <div className="px-8 py-5 border-b border-border">
        <h1 className="text-base font-bold text-foreground">Ola, {indicador.nome.split(" ")[0]}</h1>
        <p className="text-[11px] text-muted-foreground mt-0.5">Suas indicacoes em destaque</p>
      </div>
      <div className="flex-1 p-8 bg-muted/30">
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card className="border-t-4 border-t-amber-500 shadow-sm">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                <ClipboardList className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <div className="text-2xl font-bold text-amber-500">{total}</div>
                <div className="text-xs text-muted-foreground">Total indicados</div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-t-4 border-t-emerald-500 shadow-sm">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <div className="text-2xl font-bold text-emerald-500">{fechados}</div>
                <div className="text-xs text-muted-foreground">Fechados</div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-t-4 border-t-blue-500 shadow-sm">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                <Clock className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-500">{total - fechados}</div>
                <div className="text-xs text-muted-foreground">Em andamento</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-sm">
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle className="text-sm font-semibold">Ultimas Indicacoes</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {!leads?.length ? (
              <div className="text-center text-muted-foreground text-sm py-12 px-6">
                Voce ainda nao fez nenhuma indicacao.{" "}
                <a href="/indicador/indicar" className="text-amber-500 underline font-medium">Indicar agora</a>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    {["Nome", "Status", "Data"].map((h) => (
                      <th key={h} className="text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-6 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead, i) => (
                    <tr key={lead.id} className={cn("border-b border-border hover:bg-accent/40 transition-colors", i % 2 !== 0 && "bg-muted/20")}>
                      <td className="px-6 py-3.5 text-sm font-medium text-foreground">{lead.nome_lead}</td>
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
