"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Users, AlertTriangle, TrendingUp, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

function moeda(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

type Consultor = {
  id: string;
  nome: string;
  fone: string;
  plano: string;
  plano_ativo_ate: string | null;
  status: string;
  dias_vencimento: number | null;
  ultima_cobranca: { status: string; valor: number; pago_em: string | null; criado_em: string } | null;
};

type Resumo = {
  totalConsultores: number;
  totalPro: number;
  totalInadimplentes: number;
  totalRecebido: number;
};

export default function AssociacaoFinanceiroPage() {
  const [consultores, setConsultores] = useState<Consultor[]>([]);
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<"todos" | "pro" | "inadimplentes" | "vencendo">("todos");

  useEffect(() => {
    fetch("/api/associacao/financeiro")
      .then((r) => r.json())
      .then((data) => {
        setConsultores(data.consultores ?? []);
        setResumo(data.resumo ?? null);
        setCarregando(false);
      })
      .catch(() => setCarregando(false));
  }, []);

  const filtrados = consultores.filter((c) => {
    const matchBusca =
      !busca ||
      c.nome.toLowerCase().includes(busca.toLowerCase()) ||
      c.fone.includes(busca.replace(/\D/g, ""));
    if (!matchBusca) return false;
    if (filtro === "pro") return c.plano === "pro";
    if (filtro === "inadimplentes")
      return c.plano === "pro" && (!c.ultima_cobranca || c.ultima_cobranca.status !== "pago");
    if (filtro === "vencendo")
      return c.plano === "pro" && c.dias_vencimento !== null && c.dias_vencimento <= 7;
    return true;
  });

  return (
    <div className="flex-1 flex flex-col">
      <div className="px-8 py-5 border-b border-border">
        <h1 className="text-base font-bold text-foreground">Financeiro</h1>
        <p className="text-[11px] text-muted-foreground mt-0.5">Gestao de mensalidades e inadimplencia dos consultores</p>
      </div>

      <div className="flex-1 p-8 bg-muted/30 space-y-6">
        {carregando ? (
          <div className="text-center text-muted-foreground py-20 text-sm">Carregando...</div>
        ) : (
          <>
            {/* Resumo */}
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: "Total Consultores", valor: resumo?.totalConsultores ?? 0, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-t-blue-500" },
                { label: "Plano Pro", valor: resumo?.totalPro ?? 0, icon: TrendingUp, color: "text-violet-500", bg: "bg-violet-500/10", border: "border-t-violet-500" },
                { label: "Inadimplentes", valor: resumo?.totalInadimplentes ?? 0, icon: AlertTriangle, color: "text-red-500", bg: "bg-red-500/10", border: "border-t-red-500" },
                { label: "Total Recebido", valor: moeda(resumo?.totalRecebido ?? 0), icon: DollarSign, color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-t-emerald-500" },
              ].map(({ label, valor, icon: Icon, color, bg, border }) => (
                <Card key={label} className={cn("border-t-4", border)}>
                  <CardContent className="p-5 flex items-center gap-3">
                    <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0", bg)}>
                      <Icon className={cn("h-4 w-4", color)} />
                    </div>
                    <div>
                      <div className={cn("text-2xl font-bold", color)}>{valor}</div>
                      <div className="text-[10px] text-muted-foreground">{label}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Filtros */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3 border-b border-border">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <CardTitle className="text-sm font-semibold">Consultores</CardTitle>
                  <div className="flex items-center gap-3 flex-wrap">
                    <input
                      className="h-8 px-3 text-xs rounded-lg border border-border bg-muted/30 focus:outline-none focus:ring-2 focus:ring-violet-500/40 w-44"
                      placeholder="Buscar por nome..."
                      value={busca}
                      onChange={(e) => setBusca(e.target.value)}
                    />
                    <div className="flex gap-1">
                      {(["todos", "pro", "inadimplentes", "vencendo"] as const).map((f) => (
                        <button
                          key={f}
                          onClick={() => setFiltro(f)}
                          className={cn(
                            "h-7 px-3 text-xs rounded-lg font-medium transition-colors",
                            filtro === f
                              ? "bg-violet-500 text-white"
                              : "text-muted-foreground hover:bg-accent"
                          )}
                        >
                          {f === "todos" ? "Todos" : f === "pro" ? "Pro" : f === "inadimplentes" ? "Inadimplentes" : "Vencendo em 7d"}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {filtrados.length === 0 ? (
                  <div className="text-center text-sm text-muted-foreground py-14">
                    Nenhum consultor encontrado.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border bg-muted/40">
                          {["Consultor", "Plano", "Status Pagamento", "Vencimento", "Ultimo Pagamento"].map((h) => (
                            <th key={h} className="text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-4 py-3 whitespace-nowrap">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filtrados.map((c, i) => {
                          const inadimplente =
                            c.plano === "pro" &&
                            (!c.ultima_cobranca || c.ultima_cobranca.status !== "pago");
                          const vencendo =
                            c.plano === "pro" &&
                            c.dias_vencimento !== null &&
                            c.dias_vencimento <= 7 &&
                            c.dias_vencimento > 0;

                          return (
                            <tr key={c.id} className={cn("border-b border-border hover:bg-accent/40 transition-colors", i % 2 !== 0 && "bg-muted/20")}>
                              <td className="px-4 py-3">
                                <div className="text-sm font-medium">{c.nome}</div>
                                <div className="text-[11px] text-muted-foreground">{c.fone}</div>
                              </td>
                              <td className="px-4 py-3">
                                <span className={cn(
                                  "text-xs font-semibold px-2 py-0.5 rounded-full",
                                  c.plano === "pro" ? "bg-violet-500/10 text-violet-500" : "bg-muted text-muted-foreground"
                                )}>
                                  {c.plano === "pro" ? "Pro" : "Free"}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                {c.plano !== "pro" ? (
                                  <span className="text-xs text-muted-foreground">N/A</span>
                                ) : inadimplente ? (
                                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-500/10 text-red-500">Inadimplente</span>
                                ) : (
                                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">Em dia</span>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                {c.plano_ativo_ate ? (
                                  <div className="flex items-center gap-1.5">
                                    {vencendo && <Clock className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
                                    <span className={cn("text-xs", vencendo ? "text-amber-500 font-semibold" : "text-muted-foreground")}>
                                      {new Date(c.plano_ativo_ate).toLocaleDateString("pt-BR")}
                                      {c.dias_vencimento !== null && c.dias_vencimento > 0 && ` (${c.dias_vencimento}d)`}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-xs text-muted-foreground">-</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-xs text-muted-foreground">
                                {c.ultima_cobranca
                                  ? new Date(c.ultima_cobranca.pago_em ?? c.ultima_cobranca.criado_em).toLocaleDateString("pt-BR")
                                  : "-"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
