export const dynamic = "force-dynamic";
import { supabaseAdmin } from "@/lib/supabase-server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Globe, CheckCircle2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

async function getAssociacoes() {
  const { data, count } = await supabaseAdmin
    .from("associacoes")
    .select("id, nome, dominio, status, plano, criado_em", { count: "exact" })
    .order("criado_em", { ascending: false });

  const ativas = data?.filter((a) => a.status === "ativo").length ?? 0;

  return { lista: data ?? [], total: count ?? 0, ativas };
}

const statusStyle: Record<string, string> = {
  ativo: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  inativo: "bg-red-500/10 text-red-600 dark:text-red-400",
  trial: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
};

const planoStyle: Record<string, string> = {
  basico: "bg-slate-500/10 text-slate-500",
  pro: "bg-blue-500/10 text-blue-500",
  enterprise: "bg-violet-500/10 text-violet-500",
};

export default async function AssociacoesPage() {
  const { lista, total, ativas } = await getAssociacoes();

  return (
    <div className="flex-1 flex flex-col">
      <div className="px-8 py-5 border-b border-border">
        <h1 className="text-base font-bold text-foreground">Associações</h1>
        <p className="text-[11px] text-muted-foreground mt-0.5">Clientes white-label ativos na plataforma</p>
      </div>

      <div className="flex-1 p-8 bg-muted/30">
        {/* Resumo */}
        <div className="grid grid-cols-2 gap-4 mb-8 max-w-xs">
          <Card className="border-t-4 border-t-blue-500">
            <CardContent className="p-5 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                <Building2 className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-500">{total}</div>
                <div className="text-[10px] text-muted-foreground">Total</div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-t-4 border-t-emerald-500">
            <CardContent className="p-5 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </div>
              <div>
                <div className="text-2xl font-bold text-emerald-500">{ativas}</div>
                <div className="text-[10px] text-muted-foreground">Ativas</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabela */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle className="text-sm font-semibold">Lista de Associações</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {lista.length === 0 ? (
              <div className="text-center text-muted-foreground text-sm py-16">Nenhuma associação cadastrada ainda</div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    {["Nome", "Dominio", "Plano", "Status", "Desde"].map((h) => (
                      <th key={h} className="text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-6 py-3">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {lista.map((a, i) => (
                    <tr key={a.id} className={cn("border-b border-border hover:bg-accent/40 transition-colors", i % 2 !== 0 && "bg-muted/20")}>
                      <td className="px-6 py-3.5 text-sm font-medium text-foreground">{a.nome}</td>
                      <td className="px-6 py-3.5">
                        {a.dominio ? (
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Globe className="h-3.5 w-3.5" />
                            {a.dominio}
                          </div>
                        ) : (
                          <span className="text-muted-foreground/50 italic text-xs">sem domínio</span>
                        )}
                      </td>
                      <td className="px-6 py-3.5">
                        <span className={cn("text-[11px] font-semibold px-2.5 py-1 rounded-full", planoStyle[a.plano] ?? "bg-muted text-muted-foreground")}>
                          {a.plano ?? "basico"}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className={cn("text-[11px] font-semibold px-2.5 py-1 rounded-full", statusStyle[a.status] ?? "bg-muted text-muted-foreground")}>
                          {a.status}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-xs text-muted-foreground">
                        {new Date(a.criado_em).toLocaleDateString("pt-BR")}
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
