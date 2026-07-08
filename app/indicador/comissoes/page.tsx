export const dynamic = "force-dynamic";
import { getIndicadorLogado } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { PlacaMercosul } from "@/components/placa-mercosul";

const fmt = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

export default async function ComissoesPage() {
  const indicador = await getIndicadorLogado();
  if (!indicador) redirect("/indicador/login");

  const { data } = await supabaseAdmin
    .from("indicacoes")
    .select("id, placa, nome_lead, tipo_veiculo, criado_em, comissao_valor, comissao_paga, comissao_paga_em")
    .eq("indicador_id", indicador.id)
    .eq("status", "fechado")
    .order("criado_em", { ascending: false });

  const indicacoes = data ?? [];
  const total_ganho = indicacoes.reduce((acc, i) => acc + ((i.comissao_valor as number) ?? 0), 0);
  const total_pago = indicacoes
    .filter((i) => i.comissao_paga)
    .reduce((acc, i) => acc + ((i.comissao_valor as number) ?? 0), 0);
  const total_pendente = total_ganho - total_pago;

  return (
    <div className="flex-1 flex flex-col">
      <div className="px-8 py-5 border-b border-border">
        <h1 className="text-base font-bold text-foreground">Historico de Comissoes</h1>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          Vendas fechadas e status de pagamento das suas comissoes
        </p>
      </div>

      <div className="flex-1 p-8 bg-muted/30">
        {/* Cards de resumo */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1">
              Total Ganho
            </div>
            <div className="text-xl font-bold text-amber-700 dark:text-amber-300">{fmt(total_ganho)}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">{indicacoes.length} venda(s) fechada(s)</div>
          </div>

          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
            <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1">
              Ja Pago
            </div>
            <div className="text-xl font-bold text-emerald-700 dark:text-emerald-300">{fmt(total_pago)}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              {indicacoes.filter((i) => i.comissao_paga).length} comissao(oes) quitada(s)
            </div>
          </div>

          <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-4">
            <div className="text-[10px] font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400 mb-1">
              Pendente
            </div>
            <div className="text-xl font-bold text-orange-700 dark:text-orange-300">{fmt(total_pendente)}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">aguardando pagamento</div>
          </div>
        </div>

        {/* Lista */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3 border-b border-border">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Vendas Fechadas</CardTitle>
              <span className="text-xs text-muted-foreground">{indicacoes.length} registro(s)</span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {indicacoes.length === 0 ? (
              <div className="text-center text-muted-foreground text-sm py-16 px-8">
                Voce ainda nao fechou nenhuma venda. Continue indicando!
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    {["Placa", "Lead", "Veiculo", "Data", "Comissao", "Status"].map((h) => (
                      <th
                        key={h}
                        className="text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-6 py-3"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {indicacoes.map((item, i) => (
                    <tr
                      key={item.id}
                      className={cn(
                        "border-b border-border hover:bg-accent/40 transition-colors",
                        i % 2 !== 0 && "bg-muted/20"
                      )}
                    >
                      <td className="px-6 py-3">
                        {item.placa ? (
                          <PlacaMercosul placa={item.placa as string} tamanho="sm" />
                        ) : (
                          <span className="text-xs text-muted-foreground italic">sem placa</span>
                        )}
                      </td>
                      <td className="px-6 py-3.5 text-sm text-foreground">
                        {item.nome_lead ?? (
                          <span className="italic text-muted-foreground/50 text-xs">a preencher</span>
                        )}
                      </td>
                      <td className="px-6 py-3.5 text-xs text-muted-foreground">
                        {(item.tipo_veiculo as string) ?? "-"}
                      </td>
                      <td className="px-6 py-3.5 text-xs text-muted-foreground">
                        {new Date(item.criado_em as string).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="px-6 py-3.5 text-sm font-semibold text-foreground">
                        {item.comissao_valor != null ? (
                          fmt(item.comissao_valor as number)
                        ) : (
                          <span className="text-xs text-muted-foreground/50 italic">a definir</span>
                        )}
                      </td>
                      <td className="px-6 py-3.5">
                        {item.comissao_paga ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 w-fit">
                              Pago
                            </span>
                            {item.comissao_paga_em && (
                              <span className="text-[9px] text-muted-foreground/60 pl-1">
                                {new Date(item.comissao_paga_em as string).toLocaleDateString("pt-BR")}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
                            Pendente
                          </span>
                        )}
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
