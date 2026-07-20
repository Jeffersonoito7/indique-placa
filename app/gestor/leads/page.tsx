"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlacaMercosul } from "@/components/placa-mercosul";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";

interface ConsultorSimples {
  id: string;
  nome: string;
}

interface Lead {
  id: string;
  placa: string | null;
  nome_lead: string | null;
  telefone_lead: string | null;
  tipo_veiculo: string | null;
  status: string;
  criado_em: string;
  consultor_id: string | null;
  indicador_id: string | null;
  consultores: { nome: string } | null;
  indicadores: { nome: string } | null;
}

interface Totais {
  total: number;
  em_andamento: number;
  fechados: number;
  taxa: number;
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

const LIMIT = 50;

export default function GestorLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [totais, setTotais] = useState<Totais | null>(null);
  const [consultores, setConsultores] = useState<ConsultorSimples[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [carregando, setCarregando] = useState(true);
  const [carregandoMais, setCarregandoMais] = useState(false);

  const [filtroConsultor, setFiltroConsultor] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<StatusFiltro>("todos");
  const [busca, setBusca] = useState("");
  const [buscaInput, setBuscaInput] = useState("");

  const buscarLeads = useCallback(
    async (novaPagina: number, acumular: boolean) => {
      if (novaPagina === 1) setCarregando(true);
      else setCarregandoMais(true);

      const params = new URLSearchParams();
      params.set("page", String(novaPagina));
      params.set("limit", String(LIMIT));
      if (filtroConsultor) params.set("consultor_id", filtroConsultor);
      if (filtroStatus !== "todos") params.set("status", filtroStatus);
      if (busca) params.set("busca", busca);

      const res = await fetch(`/api/gestor/leads?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setLeads((prev) => (acumular ? [...prev, ...(json.leads ?? [])] : (json.leads ?? [])));
        setTotal(json.total ?? 0);
        if (!acumular) {
          setTotais(json.totais ?? null);
          setConsultores(json.consultores ?? []);
        }
      }

      if (novaPagina === 1) setCarregando(false);
      else setCarregandoMais(false);
    },
    [filtroConsultor, filtroStatus, busca]
  );

  useEffect(() => {
    setPage(1);
    buscarLeads(1, false);
  }, [filtroConsultor, filtroStatus, busca, buscarLeads]);

  function carregarMais() {
    const proxima = page + 1;
    setPage(proxima);
    buscarLeads(proxima, true);
  }

  function handleBuscaSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusca(buscaInput.trim());
  }

  const temMais = leads.length < total;

  return (
    <div className="flex-1 flex flex-col">
      <div className="px-8 py-5 border-b border-border">
        <h1 className="text-base font-bold text-foreground">Leads do Time</h1>
        <p className="text-[11px] text-muted-foreground mt-0.5">Visualize todos os leads dos consultores da sua equipe</p>
      </div>

      <div className="flex-1 p-6 bg-muted/30 space-y-4">
        {/* Cards resumo */}
        {totais && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Total leads</p>
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
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Fechados</p>
                <p className="text-2xl font-bold text-emerald-500 mt-1">{totais.fechados}</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Taxa do time</p>
                <p className="text-2xl font-bold text-indigo-500 mt-1">{totais.taxa}%</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Busca */}
          <form onSubmit={handleBuscaSubmit} className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Placa ou nome..."
                value={buscaInput}
                onChange={(e) => setBuscaInput(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-indigo-500 w-44"
              />
            </div>
            <button
              type="submit"
              className="text-xs px-3 py-1.5 bg-indigo-500 text-white rounded-md font-medium hover:bg-indigo-600 transition-colors"
            >
              Buscar
            </button>
          </form>

          {/* Consultor */}
          <select
            value={filtroConsultor}
            onChange={(e) => setFiltroConsultor(e.target.value)}
            className="text-xs border border-border rounded-md px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">Todos consultores</option>
            {consultores.map((c) => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>

          {/* Status */}
          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value as StatusFiltro)}
            className="text-xs border border-border rounded-md px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="todos">Todos status</option>
            <option value="novo">Novo</option>
            <option value="contato">Em contato</option>
            <option value="fechado">Fechado</option>
            <option value="perdido">Perdido</option>
          </select>
        </div>

        {/* Tabela */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3 border-b border-border">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Leads</CardTitle>
              <span className="text-xs text-muted-foreground">
                {carregando ? "Carregando..." : `${leads.length} de ${total}`}
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {!carregando && leads.length === 0 ? (
              <div className="text-center text-muted-foreground text-sm py-16">Nenhum lead encontrado</div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px]">
                    <thead>
                      <tr className="border-b border-border bg-muted/40">
                        {["Placa", "Proprietario", "Telefone", "Consultor", "Indicador", "Status", "Data"].map((h) => (
                          <th key={h} className="text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-5 py-3">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {leads.map((lead, i) => (
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
                          <td className="px-5 py-3.5 text-xs text-muted-foreground">
                            {lead.telefone_lead ?? "-"}
                          </td>
                          <td className="px-5 py-3.5 text-xs text-muted-foreground">
                            {lead.consultores?.nome ?? <span className="italic text-muted-foreground/40">-</span>}
                          </td>
                          <td className="px-5 py-3.5 text-xs text-muted-foreground">
                            {lead.indicadores?.nome ?? <span className="italic text-muted-foreground/40">-</span>}
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={cn("text-[11px] font-semibold px-2.5 py-1 rounded-full", STATUS_STYLE[lead.status] ?? "bg-muted text-muted-foreground")}>
                              {STATUS_LABEL[lead.status] ?? lead.status}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-xs text-muted-foreground">
                            {new Date(lead.criado_em).toLocaleDateString("pt-BR")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {temMais && (
                  <div className="p-4 flex justify-center border-t border-border">
                    <button
                      onClick={carregarMais}
                      disabled={carregandoMais}
                      className="text-xs px-4 py-2 border border-border rounded-md text-muted-foreground hover:border-indigo-400 hover:text-indigo-500 transition-colors disabled:opacity-50"
                    >
                      {carregandoMais ? "Carregando..." : `Carregar mais (${total - leads.length} restantes)`}
                    </button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
