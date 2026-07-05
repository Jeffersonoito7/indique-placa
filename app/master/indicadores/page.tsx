export const dynamic = "force-dynamic";
import { supabaseAdmin } from "@/lib/supabase-server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";

async function getIndicadores() {
  const { data, count } = await supabaseAdmin
    .from("indicadores")
    .select("id, nome, telefone, consultor_id, criado_em, consultores(nome)", { count: "exact" })
    .order("criado_em", { ascending: false });

  return { lista: data ?? [], total: count ?? 0 };
}

export default async function IndicadoresPage() {
  const { lista, total } = await getIndicadores();

  return (
    <div className="flex-1 flex flex-col">
      <div className="px-8 py-5 border-b border-border">
        <h1 className="text-base font-bold text-foreground">Indicadores</h1>
        <p className="text-[11px] text-muted-foreground mt-0.5">Captadores de leads vinculados aos consultores</p>
      </div>

      <div className="flex-1 p-8 bg-muted/30">
        {/* Resumo */}
        <div className="grid grid-cols-2 gap-4 mb-8 max-w-sm">
          <Card className="border-t-4 border-t-violet-500">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                <UserCheck className="h-5 w-5 text-violet-500" />
              </div>
              <div>
                <div className="text-2xl font-bold text-violet-500">{total}</div>
                <div className="text-xs text-muted-foreground">Total cadastrados</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabela */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle className="text-sm font-semibold">Lista de Indicadores</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {lista.length === 0 ? (
              <div className="text-center text-muted-foreground text-sm py-16">Nenhum indicador cadastrado ainda</div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    {["Nome", "Telefone", "Consultor vinculado", "Cadastro"].map((h) => (
                      <th key={h} className="text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-6 py-3">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {lista.map((ind, i) => (
                    <tr key={ind.id} className={cn("border-b border-border hover:bg-accent/40 transition-colors", i % 2 !== 0 && "bg-muted/20")}>
                      <td className="px-6 py-3.5 text-sm font-medium text-foreground">{ind.nome}</td>
                      <td className="px-6 py-3.5 text-sm text-muted-foreground font-mono">{ind.telefone ?? "-"}</td>
                      <td className="px-6 py-3.5 text-sm text-muted-foreground">
                        {(ind.consultores as any)?.nome ?? (
                          <span className="text-muted-foreground/50 italic">sem vinculo</span>
                        )}
                      </td>
                      <td className="px-6 py-3.5 text-xs text-muted-foreground">
                        {new Date(ind.criado_em).toLocaleDateString("pt-BR")}
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
