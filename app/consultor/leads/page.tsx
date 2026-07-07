"use client";

import { useEffect, useState, useMemo } from "react";
import { PlacaMercosul } from "@/components/placa-mercosul";
import { AbrirWhatsApp } from "@/components/abrir-whatsapp";

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

type StatusLead = "novo" | "contato" | "fechado" | "perdido";

interface Indicador {
  nome: string;
  chave_pix: string | null;
}

interface Lead {
  id: string;
  placa: string | null;
  nome_lead: string | null;
  telefone_lead: string | null;
  status: StatusLead;
  criado_em: string;
  tipo_veiculo: string | null;
  pago_em: string | null;
  comprovante_url: string | null;
  valor_pago: number | null;
  indicadores: Indicador | null;
}

// ---------------------------------------------------------------------------
// Config de colunas
// ---------------------------------------------------------------------------

const COLUNAS: { key: StatusLead; label: string; cor: string; borda: string; badge: string }[] = [
  {
    key: "novo",
    label: "Novo",
    cor: "#3b82f6",
    borda: "border-l-blue-500",
    badge: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
  {
    key: "contato",
    label: "Em Contato",
    cor: "#f59e0b",
    borda: "border-l-amber-500",
    badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  {
    key: "fechado",
    label: "Fechado",
    cor: "#10b981",
    borda: "border-l-emerald-500",
    badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  {
    key: "perdido",
    label: "Perdido",
    cor: "#ef4444",
    borda: "border-l-red-500",
    badge: "bg-red-500/10 text-red-600 dark:text-red-400",
  },
];

const STATUS_ABREV: Record<StatusLead, string> = {
  novo: "N",
  contato: "C",
  fechado: "F",
  perdido: "P",
};

const STATUS_COR: Record<StatusLead, string> = {
  novo: "bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400",
  contato: "bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400",
  fechado: "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400",
  perdido: "bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400",
};

// ---------------------------------------------------------------------------
// Componente Card de Lead
// ---------------------------------------------------------------------------

function LeadCard({
  lead,
  atualizando,
  onMudarStatus,
}: {
  lead: Lead;
  atualizando: boolean;
  onMudarStatus: (id: string, status: StatusLead) => void;
}) {
  const coluna = COLUNAS.find((c) => c.key === lead.status)!;
  const data = new Date(lead.criado_em).toLocaleDateString("pt-BR");
  const indicadorNome = lead.indicadores?.nome ?? null;

  return (
    <div
      className={`bg-white dark:bg-zinc-900 rounded-lg border border-border border-l-4 ${coluna.borda} p-3 shadow-sm opacity-${atualizando ? "60" : "100"} transition-opacity`}
    >
      {/* Linha 1: Placa */}
      <div className="mb-2">
        {lead.placa ? (
          <PlacaMercosul placa={lead.placa} tamanho="sm" />
        ) : (
          <span className="text-xs text-muted-foreground italic">sem placa</span>
        )}
      </div>

      {/* Linha 2: Nome + tipo */}
      <div className="flex items-center gap-1.5 mb-1">
        {lead.nome_lead ? (
          <span className="text-sm font-medium text-foreground truncate">{lead.nome_lead}</span>
        ) : (
          <span className="text-xs italic text-muted-foreground/60">Proprietario a confirmar</span>
        )}
        {lead.tipo_veiculo && (
          <span className="ml-auto text-[10px] font-medium bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full capitalize flex-shrink-0">
            {lead.tipo_veiculo}
          </span>
        )}
      </div>

      {/* Linha 3: Indicador */}
      <div className="text-[11px] text-muted-foreground mb-2">
        {indicadorNome ? (
          <>via <span className="font-medium">{indicadorNome}</span></>
        ) : (
          <span className="italic">direto</span>
        )}
      </div>

      {/* Linha 4: Data + WhatsApp */}
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-[10px] text-muted-foreground">{data}</span>
        {lead.telefone_lead && (
          <AbrirWhatsApp telefone={lead.telefone_lead} nome={lead.nome_lead ?? lead.placa ?? ""} />
        )}
      </div>

      {/* Botoes de status */}
      <div className="flex gap-1">
        {COLUNAS.map((col) => (
          <button
            key={col.key}
            disabled={atualizando || lead.status === col.key}
            onClick={() => onMudarStatus(lead.id, col.key)}
            title={col.label}
            className={`flex-1 text-[10px] font-bold py-0.5 rounded transition-colors disabled:cursor-default
              ${lead.status === col.key
                ? STATUS_COR[col.key] + " ring-1 ring-current"
                : "bg-muted/40 hover:bg-muted text-muted-foreground"
              }`}
          >
            {STATUS_ABREV[col.key]}
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

export default function ConsultorLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [visao, setVisao] = useState<"kanban" | "lista">("kanban");
  const [abaAtiva, setAbaAtiva] = useState<StatusLead>("novo");
  const [atualizando, setAtualizando] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/consultor/leads")
      .then((r) => {
        if (!r.ok) throw new Error("Erro ao carregar leads");
        return r.json() as Promise<Lead[]>;
      })
      .then((data) => setLeads(data))
      .catch((e: Error) => setErro(e.message))
      .finally(() => setCarregando(false));
  }, []);

  const leadsFiltrados = useMemo(() => {
    const q = busca.toLowerCase().trim();
    if (!q) return leads;
    return leads.filter((l) => {
      const placa = (l.placa ?? "").toLowerCase();
      const nome = (l.nome_lead ?? "").toLowerCase();
      const ind = (l.indicadores?.nome ?? "").toLowerCase();
      return placa.includes(q) || nome.includes(q) || ind.includes(q);
    });
  }, [leads, busca]);

  async function mudarStatus(id: string, status: StatusLead) {
    setAtualizando((prev) => new Set(prev).add(id));
    try {
      const res = await fetch(`/api/consultor/lead/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Falha ao atualizar");
      setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
    } catch {
      // falha silenciosa no estado local; usuario pode tentar novamente
    } finally {
      setAtualizando((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }

  const total = leadsFiltrados.length;

  // -------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Cabecalho */}
      <div className="px-4 md:px-8 py-4 border-b border-border flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-base font-bold text-foreground">
            Minhas Placas
            {!carregando && (
              <span className="ml-2 text-xs font-normal text-muted-foreground">({total})</span>
            )}
          </h1>
          <p className="text-[11px] text-muted-foreground mt-0.5">Gestao de indicacoes recebidas</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar placa, nome ou indicador..."
            className="text-sm border border-border rounded-lg px-3 py-1.5 bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring w-56"
          />
          <button
            onClick={() => setVisao((v) => (v === "kanban" ? "lista" : "kanban"))}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-muted transition-colors text-foreground"
          >
            {visao === "kanban" ? "Lista" : "Kanban"}
          </button>
        </div>
      </div>

      {/* Corpo */}
      {carregando ? (
        <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
          Carregando...
        </div>
      ) : erro ? (
        <div className="flex-1 flex items-center justify-center text-sm text-red-500">{erro}</div>
      ) : visao === "lista" ? (
        // ---------------------------------------------------------------
        // Visao Lista
        // ---------------------------------------------------------------
        <div className="flex-1 overflow-auto p-4 md:p-8">
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/40 border-b border-border">
                  {["Placa", "Proprietario", "Indicado por", "Tipo", "Status", "Data", ""].map((h) => (
                    <th key={h} className="text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-4 py-2.5">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {!leadsFiltrados.length ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-sm text-muted-foreground">
                      Nenhuma indicacao encontrada
                    </td>
                  </tr>
                ) : (
                  leadsFiltrados.map((lead, i) => {
                    const col = COLUNAS.find((c) => c.key === lead.status)!;
                    return (
                      <tr key={lead.id} className={`border-b border-border hover:bg-accent/30 transition-colors ${i % 2 !== 0 ? "bg-muted/10" : ""}`}>
                        <td className="px-4 py-2">
                          {lead.placa ? (
                            <PlacaMercosul placa={lead.placa} tamanho="sm" />
                          ) : (
                            <span className="text-xs italic text-muted-foreground">sem placa</span>
                          )}
                        </td>
                        <td className="px-4 py-2">
                          <div className="font-medium text-foreground">
                            {lead.nome_lead ?? <span className="italic text-muted-foreground/60 text-xs">a preencher</span>}
                          </div>
                          {lead.telefone_lead && (
                            <div className="text-[10px] text-muted-foreground font-mono mt-0.5">{lead.telefone_lead}</div>
                          )}
                        </td>
                        <td className="px-4 py-2 text-muted-foreground">
                          {lead.indicadores?.nome ?? <span className="italic text-muted-foreground/50 text-xs">direto</span>}
                        </td>
                        <td className="px-4 py-2 capitalize text-muted-foreground text-xs">
                          {lead.tipo_veiculo ?? "carro"}
                        </td>
                        <td className="px-4 py-2">
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${col.badge}`}>
                            {col.label}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-xs text-muted-foreground">
                          {new Date(lead.criado_em).toLocaleDateString("pt-BR")}
                        </td>
                        <td className="px-4 py-2">
                          {lead.telefone_lead && (
                            <AbrirWhatsApp telefone={lead.telefone_lead} nome={lead.nome_lead ?? lead.placa ?? ""} />
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        // ---------------------------------------------------------------
        // Visao Kanban
        // ---------------------------------------------------------------
        <>
          {/* Tabs mobile */}
          <div className="flex md:hidden border-b border-border bg-background">
            {COLUNAS.map((col) => {
              const qtd = leadsFiltrados.filter((l) => l.status === col.key).length;
              return (
                <button
                  key={col.key}
                  onClick={() => setAbaAtiva(col.key)}
                  className={`flex-1 py-2 text-xs font-semibold transition-colors border-b-2
                    ${abaAtiva === col.key
                      ? "border-current text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  style={abaAtiva === col.key ? { color: col.cor, borderColor: col.cor } : {}}
                >
                  {col.label}
                  <span className="ml-1 text-[10px] opacity-70">({qtd})</span>
                </button>
              );
            })}
          </div>

          {/* Colunas desktop / coluna ativa mobile */}
          <div className="flex-1 flex gap-3 p-4 md:p-6 overflow-x-auto min-h-0">
            {COLUNAS.map((col) => {
              const isMobileInativa = typeof window !== "undefined"
                ? false // SSR: render all, CSS hide
                : false;
              const leadsColuna = leadsFiltrados.filter((l) => l.status === col.key);
              return (
                <div
                  key={col.key}
                  className={`flex-shrink-0 w-full md:w-72 flex flex-col min-h-0 ${col.key !== abaAtiva ? "hidden md:flex" : "flex"}`}
                >
                  {/* Cabecalho coluna */}
                  <div
                    className="flex items-center gap-2 mb-3 px-1"
                  >
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: col.cor }} />
                    <span className="text-sm font-semibold text-foreground">{col.label}</span>
                    <span
                      className="ml-auto text-[11px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{ backgroundColor: col.cor + "20", color: col.cor }}
                    >
                      {leadsColuna.length}
                    </span>
                  </div>

                  {/* Cards */}
                  <div
                    className="flex-1 overflow-y-auto space-y-2.5 pr-0.5"
                    style={{ maxHeight: "calc(100vh - 180px)" }}
                  >
                    {leadsColuna.length === 0 ? (
                      <div className="text-center text-xs text-muted-foreground py-10 border border-dashed border-border rounded-lg">
                        Nenhuma indicacao aqui ainda
                      </div>
                    ) : (
                      leadsColuna.map((lead) => (
                        <LeadCard
                          key={lead.id}
                          lead={lead}
                          atualizando={atualizando.has(lead.id)}
                          onMudarStatus={mudarStatus}
                        />
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
