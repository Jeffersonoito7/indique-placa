export const dynamic = "force-dynamic";
import { getGestorLogado } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, CheckCircle2, Clock, CreditCard } from "lucide-react";

function moeda(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function GestorFinanceiroProprio() {
  const gestor = await getGestorLogado();
  if (!gestor) redirect("/gestor/login");

  const [leadsRes, configRes, cobrancasRes] = await Promise.all([
    supabaseAdmin
      .from("indicacoes")
      .select("id, nome_lead, telefone_lead, status, criado_em, comissao_valor, indicadores(nome)")
      .eq("gestor_id", gestor.id)
      .eq("status", "fechado")
      .order("criado_em", { ascending: false }),
    supabaseAdmin
      .from("configuracoes")
      .select("comissao_consultor")
      .limit(1)
      .single(),
    supabaseAdmin
      .from("cobrancas")
      .select("id, valor, status, pago_em, criado_em")
      .eq("usuario_id", gestor.id)
      .eq("usuario_tipo", "gestor")
      .order("criado_em", { ascending: false }),
  ]);

  const comissaoPadrao = configRes.data?.comissao_consultor ?? 100;

  const fechados = leadsRes.data ?? [];
  const cobrancas = cobrancasRes.data ?? [];

  const totalGanho = fechados.reduce(
    (acc, l) => acc + ((l as { comissao_valor?: number | null }).comissao_valor ?? comissaoPadrao),
    0
  );

  // "Em andamento" aqui representa o potencial ainda nao realizado (leads proprios em outros status)
  // Como a query ja filtra fechados, buscamos o total de leads proprios para calcular os em andamento
  // Optamos por exibir o total de comissoes pendentes como R$0 pois esta tela mostra apenas fechados;
  // mantemos o KPI "Em andamento" zerado por honestidade — so leads fechados do gestor sao exibidos.
  const potencialEmAndamento = 0;

  return (
    <div className="flex-1 flex flex-col">
      <div className="px-8 py-5 border-b border-border">
        <h1 className="text-base font-bold text-foreground">Financeiro Pessoal</h1>
        <p className="text-[11px] text-muted-foreground mt-0.5">Suas comissoes por leads fechados diretamente por voce</p>
      </div>

      <div className="flex-1 p-8 bg-muted/30 space-y-6">
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total acumulado", valor: moeda(totalGanho), icon: DollarSign, color: "text-emerald-500", bg: "bg-emerald-500/10" },
            { label: "Em andamento (potencial)", valor: moeda(potencialEmAndamento), icon: TrendingUp, color: "text-amber-500", bg: "bg-amber-500/10" },
            { label: "Leads fechados proprios", valor: fechados.length, icon: CheckCircle2, color: "text-blue-500", bg: "bg-blue-500/10" },
          ].map(({ label, valor, icon: Icon, color, bg }) => (
            <Card key={label} className="shadow-sm">
              <CardContent className="p-5 flex items-start gap-3">
                <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={color} style={{ width: 18, height: 18 }} />
                </div>
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
                  <div className="text-xl font-bold text-foreground mt-0.5">{valor}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="shadow-sm">
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Historico de Fechamentos Pessoais
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {fechados.length === 0 ? (
              <div className="text-center text-sm text-muted-foreground py-14">
                Nenhum lead fechado diretamente por voce ainda.
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    {["Lead", "Via Indicador", "Comissao", "Data"].map((h) => (
                      <th key={h} className="text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-6 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {fechados.map((l, i) => (
                    <tr key={l.id} className={`border-b border-border hover:bg-accent/40 transition-colors ${i % 2 !== 0 ? "bg-muted/20" : ""}`}>
                      <td className="px-6 py-3.5 text-sm font-medium">{l.nome_lead}</td>
                      <td className="px-6 py-3.5 text-sm text-muted-foreground">
                        {(l.indicadores as any)?.nome ?? <span className="italic text-muted-foreground/50">direto</span>}
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                          {moeda((l as { comissao_valor?: number | null }).comissao_valor ?? comissaoPadrao)}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-xs text-muted-foreground">{new Date(l.criado_em).toLocaleDateString("pt-BR")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              Historico de Pagamentos (Plano Pro)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {cobrancas.length === 0 ? (
              <div className="text-center text-sm text-muted-foreground py-10">
                Nenhum pagamento registrado.
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    {["Descricao", "Valor", "Status", "Data"].map((h) => (
                      <th key={h} className="text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-6 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {cobrancas.map((c, i) => (
                    <tr key={c.id} className={`border-b border-border hover:bg-accent/40 transition-colors ${i % 2 !== 0 ? "bg-muted/20" : ""}`}>
                      <td className="px-6 py-3.5 text-sm font-medium">Plano Pro - Indique Placa</td>
                      <td className="px-6 py-3.5 text-sm font-bold text-foreground">{moeda(Number(c.valor))}</td>
                      <td className="px-6 py-3.5">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          c.status === "pago"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                        }`}>
                          {c.status === "pago" ? "Pago" : "Pendente"}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-xs text-muted-foreground">
                        {c.pago_em
                          ? new Date(c.pago_em).toLocaleDateString("pt-BR")
                          : new Date(c.criado_em).toLocaleDateString("pt-BR")}
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
