"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlacaMercosul } from "@/components/placa-mercosul";
import { cn } from "@/lib/utils";
import { CheckCircle2, ExternalLink, AlertTriangle, ListFilter } from "lucide-react";

type ConsultorNome = { nome: string } | null;

interface Lead {
  id: string;
  placa: string | null;
  nome_lead: string | null;
  telefone_lead: string | null;
  tipo_veiculo: string | null;
  status: string;
  criado_em: string;
  comissao_valor: number | null;
  comissao_paga: boolean | null;
  comissao_paga_em: string | null;
  consultor_id: string | null;
  consultores: ConsultorNome;
}

interface Totais {
  total: number;
  em_andamento: number;
  fechadas: number;
  comissao_total: number;
  comissao_paga: number;
}

type StatusFiltro = "todos" | "novo" | "contato" | "fechado" | "perdido";

const STATUS_STYLE: Record<string, string> = {
  novo: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  contato: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  fechado: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  perdido: "bg-red-500/10 text-red-600 dark:text-red-400",
};

const STATUS_LABEL: Record<string, string> = {
  novo: "Novo",
  contato: "Em contato",
  fechado: "Fechado",
  perdido: "Perdido",
};

const FILTROS: { value: StatusFiltro; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "novo", label: "Novo" },
  { value: "contato", label: "Em contato" },
  { value: "fechado", label: "Fechado" },
  { value: "perdido", label: "Perdido" },
];

function diasDesde(dataStr: string): number {
  const agora = new Date();
  const criado = new Date(dataStr);
  return Math.floor((agora.getTime() - criado.getTime()) / (1000 * 60 * 60 * 24));
}

function alertaLead(lead: Lead): string | null {
  const dias = diasDesde(lead.criado_em);
  if (lead.status === "novo" && dias > 7) {
    return "Seu consultor ainda nao entrou em contato com este lead";
  }
  if (lead.status === "contato" && dias > 14) {
    return "Seu lead esta parado ha mais de 14 dias";
  }
  return null;
}

function formatarMoeda(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function IndicadorHistoricoPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [totais, setTotais] = useState<Totais | null>(null);
  const [filtro, setFiltro] = useState<StatusFiltro>("todos");
  const [carregando, setCarregando] = useState(true);

  const buscar = useCallback(async (status: StatusFiltro) => {
    setCarregando(true);
    const params = status !== "todos" ? `?status=${status}` : "";
    const res = await fetch(`/api/indicador/historico${params}`);
    if (res.ok) {
      const json = await res.json();
      setLeads(json.leads ?? []);
      setTotais(json.totais ?? null);
    }
    setCarregando(false);
  }, []);

  useEffect(() => {
    buscar(filtro);
  }, [filtro, buscar]);

  return (
    <div className="flex-1 flex flex-col">
      <div className="px-8 py-5 border-b border-border">
        <h1 className="text-base font-bold text-foreground">Minhas Indicacoes</h1>
        <p className="text-[11px] text-muted-foreground mt-0.5">Acompanhe o status de cada placa que voce indicou</p>
      </div>

      <div className="flex-1 p-6 bg-muted/30 space-y-4">
        {/* Cards resumo */}
        {totais && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Total indicadas</p>
                <p className="text-2xl font-bold text-foreground mt-1">{totais.total}</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Em andamento</p>
                <p className="text-2xl font-bold text-amber-500 mt-1">{totais.em_andamento}</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Fechadas</p>
                <p className="text-2xl font-bold text-emerald-500 mt-1">{totais.fechadas}</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Comissao total</p>
                <p className="text-lg font-bold text-foreground mt-1">{formatarMoeda(totais.comissao_total)}</p>
                <p className="text-[10px] text-muted-foreground">{formatarMoeda(totais.comissao_paga)} pago</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filtros */}
        <div className="flex items-center gap-2 flex-wrap">
          <ListFilter className="h-4 w-4 text-muted-foreground" />
          {FILTROS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFiltro(f.value)}
              className={cn(
                "text-xs px-3 py-1.5 rounded-full border font-medium transition-colors",
                filtro === f.value
                  ? "bg-amber-500 text-white border-amber-500"
                  : "border-border text-muted-foreground hover:border-amber-400 hover:text-amber-500"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Tabela */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3 border-b border-border">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Historico</CardTitle>
              <span className="text-xs text-muted-foreground">
                {carregando ? "Carregando..." : `${leads.length} indicacoes`}
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {!carregando && leads.length === 0 ? (
              <div className="text-center text-muted-foreground text-sm py-16">Nenhuma indicacao encontrada</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px]">
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      {["Placa", "Proprietario", "Tipo", "Status", "Consultor", "Data", "Comissao"].map((h) => (
                        <th key={h} className="text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-5 py-3">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map((lead, i) => {
                      const alerta = alertaLead(lead);
                      return (
                        <>
                          <tr
                            key={lead.id}
                            className={cn(
                              "border-b border-border hover:bg-accent/40 transition-colors",
                              i % 2 !== 0 && "bg-muted/20"
                            )}
                          >
                            <td className="px-5 py-3">
                              {lead.placa ? (
                                <PlacaMercosul placa={lead.placa} tamanho="sm" />
                              ) : (
                                <span className="text-xs text-muted-foreground italic">sem placa</span>
                              )}
                            </td>
                            <td className="px-5 py-3.5 text-sm text-foreground">
                              {lead.nome_lead ?? <span className="italic text-muted-foreground/50 text-xs">a preencher</span>}
                            </td>
                            <td className="px-5 py-3.5 text-xs text-muted-foreground capitalize">
                              {lead.tipo_veiculo ?? "-"}
                            </td>
                            <td className="px-5 py-3.5">
                              <span className={cn("text-[11px] font-semibold px-2.5 py-1 rounded-full", STATUS_STYLE[lead.status] ?? "bg-muted text-muted-foreground")}>
                                {STATUS_LABEL[lead.status] ?? lead.status}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-xs text-muted-foreground">
                              {lead.consultores?.nome ?? <span className="italic text-muted-foreground/40">nao atribuido</span>}
                            </td>
                            <td className="px-5 py-3.5 text-xs text-muted-foreground">
                              {new Date(lead.criado_em).toLocaleDateString("pt-BR")}
                            </td>
                            <td className="px-5 py-3.5">
                              {lead.status === "fechado" ? (
                                <div className="flex flex-col gap-0.5">
                                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                    {lead.comissao_valor ? formatarMoeda(lead.comissao_valor) : "-"}
                                  </span>
                                  {lead.comissao_paga ? (
                                    <div className="flex items-center gap-1">
                                      <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Pago</span>
                                    </div>
                                  ) : (
                                    <span className="text-[10px] text-amber-500 font-medium">Pendente</span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-[11px] text-muted-foreground/40 italic">-</span>
                              )}
                            </td>
                          </tr>
                          {alerta && (
                            <tr key={`alerta-${lead.id}`} className="border-b border-border">
                              <td colSpan={7} className="px-5 py-2 bg-amber-500/5">
                                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                                  <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                                  <span className="text-[11px] font-medium">{alerta}</span>
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
