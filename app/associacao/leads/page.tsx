"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Search, TrendingUp, CheckCircle2, Clock, List } from "lucide-react";

interface Lead {
  id: string;
  placa: string;
  nome_lead?: string | null;
  telefone_lead?: string | null;
  tipo_veiculo?: string | null;
  status: string;
  criado_em: string;
  consultores?: { nome: string } | null;
}

interface Totais {
  total: number;
  novos: number;
  em_andamento: number;
  fechados: number;
  taxa: number;
}

const STATUS_LABELS: Record<string, string> = {
  novo: "Novo",
  em_andamento: "Em andamento",
  fechado: "Fechado",
  cancelado: "Cancelado",
};

const STATUS_COLORS: Record<string, string> = {
  novo: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  em_andamento: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  fechado: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  cancelado: "bg-red-500/15 text-red-400 border-red-500/20",
};

function fmtData(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

export default function AssociacaoLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [totais, setTotais] = useState<Totais>({ total: 0, novos: 0, em_andamento: 0, fechados: 0, taxa: 0 });
  const [total, setTotal] = useState(0);
  const [busca, setBusca] = useState("");
  const [statusFiltro, setStatusFiltro] = useState("todos");
  const [page, setPage] = useState(1);
  const [carregando, setCarregando] = useState(true);
  const limit = 50;

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (statusFiltro !== "todos") params.set("status", statusFiltro);
      if (busca.trim()) params.set("busca", busca.trim());
      const res = await fetch(`/api/associacao/leads?${params}`);
      if (!res.ok) return;
      const json = await res.json();
      setLeads(json.leads ?? []);
      setTotal(json.total ?? 0);
      setTotais(json.totais ?? { total: 0, novos: 0, em_andamento: 0, fechados: 0, taxa: 0 });
    } finally {
      setCarregando(false);
    }
  }, [page, statusFiltro, busca]);

  useEffect(() => { carregar(); }, [carregar]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="flex-1 flex flex-col">
      <div className="px-8 py-5 border-b border-border">
        <h1 className="text-base font-bold text-foreground">Leads da Rede</h1>
        <p className="text-[11px] text-muted-foreground mt-0.5">Todas as indicacoes geradas pelos consultores da sua associacao</p>
      </div>

      <div className="flex-1 p-6 bg-muted/30 space-y-4">
        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total", value: totais.total, icon: List, color: "text-violet-400" },
            { label: "Novos", value: totais.novos, icon: Clock, color: "text-blue-400" },
            { label: "Fechados", value: totais.fechados, icon: CheckCircle2, color: "text-emerald-400" },
            { label: "Taxa Fechamento", value: `${totais.taxa}%`, icon: TrendingUp, color: "text-amber-400" },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label} className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
                    <p className={`text-xl font-bold mt-0.5 ${color}`}>{value}</p>
                  </div>
                  <Icon className={`h-5 w-5 ${color} opacity-60`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={busca}
              onChange={(e) => { setBusca(e.target.value); setPage(1); }}
              placeholder="Buscar por placa ou nome..."
              className="w-full pl-9 pr-3 py-2 text-sm rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400"
            />
          </div>
          <select
            value={statusFiltro}
            onChange={(e) => { setStatusFiltro(e.target.value); setPage(1); }}
            className="px-3 py-2 text-sm rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/30"
          >
            <option value="todos">Todos os status</option>
            <option value="novo">Novos</option>
            <option value="em_andamento">Em andamento</option>
            <option value="fechado">Fechados</option>
            <option value="cancelado">Cancelados</option>
          </select>
        </div>

        {/* Tabela */}
        <Card className="shadow-sm">
          <CardContent className="p-0">
            {carregando ? (
              <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">Carregando...</div>
            ) : leads.length === 0 ? (
              <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">Nenhum lead encontrado</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Placa</th>
                      <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Lead</th>
                      <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hidden md:table-cell">Consultor</th>
                      <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                      <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hidden sm:table-cell">Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map((lead) => (
                      <tr key={lead.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-foreground">{lead.placa}</td>
                        <td className="px-4 py-3 text-foreground">{lead.nome_lead ?? <span className="text-muted-foreground/50 italic text-xs">nao informado</span>}</td>
                        <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{(lead.consultores as { nome: string } | null)?.nome ?? "-"}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${STATUS_COLORS[lead.status] ?? "bg-muted text-muted-foreground"}`}>
                            {STATUS_LABELS[lead.status] ?? lead.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs hidden sm:table-cell">{fmtData(lead.criado_em)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Paginacao */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{total} leads no total</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded border border-border hover:bg-muted disabled:opacity-40 transition-colors"
              >
                Anterior
              </button>
              <span>Pag. {page} de {totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 rounded border border-border hover:bg-muted disabled:opacity-40 transition-colors"
              >
                Proxima
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
