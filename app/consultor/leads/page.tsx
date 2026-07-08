"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
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
  comissao_valor: number | null;
  comissao_paga: boolean | null;
  comissao_paga_em: string | null;
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
// Botao pagar comissao (visao lista)
// ---------------------------------------------------------------------------

function BotaoPagarComissao({ lead, onPago }: { lead: Lead; onPago: (leadId: string) => void }) {
  const [enviando, setEnviando] = useState(false);

  async function pagar() {
    const valor = lead.comissao_valor
      ? lead.comissao_valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
      : "a combinar";
    const confirmado = window.confirm(
      `Confirmar pagamento da comissao de ${valor} para ${lead.indicadores?.nome ?? "o indicador"}?`
    );
    if (!confirmado) return;
    setEnviando(true);
    try {
      const res = await fetch(`/api/consultor/lead/${lead.id}/pagar-comissao`, { method: "POST" });
      if (!res.ok) {
        const json = await res.json() as { error?: string };
        alert(json.error ?? "Erro ao registrar pagamento");
        return;
      }
      onPago(lead.id);
    } catch {
      alert("Erro de conexao");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <button
      onClick={() => void pagar()}
      disabled={enviando}
      className="text-[11px] font-semibold px-2.5 py-1 rounded-lg border border-emerald-500 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 transition-colors disabled:opacity-50 whitespace-nowrap"
    >
      {enviando ? "Registrando..." : "Pagar comissao"}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Skeleton de linha (lista paginada)
// ---------------------------------------------------------------------------

function LeadSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50 animate-pulse">
      <div className="h-4 w-20 bg-muted rounded" />
      <div className="h-4 w-32 bg-muted rounded flex-1" />
      <div className="h-6 w-16 bg-muted rounded-full" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Componente Card de Lead
// ---------------------------------------------------------------------------

function moeda(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function PainelPagamento({ lead, onPago }: { lead: Lead; onPago: (leadId: string, valorPago: number | null, comprovanteUrl: string | null) => void }) {
  const [aberto, setAberto] = useState(false);
  const [valor, setValor] = useState(lead.valor_pago?.toString() ?? "");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const pago = !!lead.pago_em;

  if (!lead.indicadores?.nome) return null;

  if (pago) {
    return (
      <div className="mt-2 pt-2 border-t border-border flex items-center gap-2">
        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">Pago</span>
        {lead.valor_pago && <span className="text-[10px] text-muted-foreground">{moeda(lead.valor_pago)}</span>}
        {lead.comprovante_url && (
          <a href={lead.comprovante_url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-500 underline ml-auto">ver comprovante</a>
        )}
      </div>
    );
  }

  const enviar = async () => {
    if (!arquivo) { setErro("Selecione o comprovante"); return; }
    setEnviando(true);
    setErro("");
    const form = new FormData();
    form.append("comprovante", arquivo);
    if (valor) form.append("valor", valor);
    try {
      const res = await fetch(`/api/consultor/lead/${lead.id}/pagamento`, { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) { setErro(json.error ?? "Erro ao registrar"); return; }
      onPago(lead.id, valor ? Number(valor) : null, json.comprovante_url);
      setAberto(false);
    } catch { setErro("Erro de conexao"); }
    finally { setEnviando(false); }
  };

  return (
    <div className="mt-2 pt-2 border-t border-border">
      {!aberto ? (
        <button
          onClick={() => setAberto(true)}
          className="w-full text-[11px] font-bold py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 transition-colors"
        >
          Confirmar pagamento ao indicador
        </button>
      ) : (
        <div className="space-y-2">
          <div className="text-[10px] font-bold text-muted-foreground uppercase">Pix: {lead.indicadores.chave_pix ?? "nao cadastrado"}</div>
          <input
            type="number"
            placeholder="Valor pago (R$)"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            className="w-full text-xs px-2 py-1.5 border border-border rounded-lg bg-background focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          <label className="block w-full text-center text-[11px] font-semibold py-1.5 rounded-lg border border-border bg-muted cursor-pointer hover:bg-muted/80">
            {arquivo ? arquivo.name : "Anexar comprovante"}
            <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => setArquivo(e.target.files?.[0] ?? null)} />
          </label>
          {erro && <div className="text-[10px] text-red-500">{erro}</div>}
          <div className="flex gap-1.5">
            <button onClick={() => setAberto(false)} className="flex-1 text-[11px] py-1.5 rounded-lg border border-border text-muted-foreground hover:bg-muted">Cancelar</button>
            <button onClick={enviar} disabled={enviando} className="flex-1 text-[11px] font-bold py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white disabled:opacity-50">
              {enviando ? "Enviando..." : "Confirmar"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function LeadCard({
  lead,
  atualizando,
  onMudarStatus,
  onPago,
}: {
  lead: Lead;
  atualizando: boolean;
  onMudarStatus: (id: string, status: StatusLead) => void;
  onPago: (leadId: string, valorPago: number | null, comprovanteUrl: string | null) => void;
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

      {/* Pagamento ao indicador (so quando fechado e tem indicador) */}
      {lead.status === "fechado" && <PainelPagamento lead={lead} onPago={onPago} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

const LIMIT = 20;

export default function ConsultorLeadsPage() {
  // --- Estado kanban (carrega tudo de uma vez, sem paginacao) ---
  const [leadsKanban, setLeadsKanban] = useState<Lead[]>([]);
  const [carregandoKanban, setCarregandoKanban] = useState(true);
  const [erroKanban, setErroKanban] = useState<string | null>(null);

  // --- Estado lista (paginado, server-side) ---
  const [leadsLista, setLeadsLista] = useState<Lead[]>([]);
  const [totalLista, setTotalLista] = useState(0);
  const [carregandoLista, setCarregandoLista] = useState(false);
  const [erroLista, setErroLista] = useState<string | null>(null);

  // --- Estado compartilhado ---
  const [visao, setVisao] = useState<"kanban" | "lista">("kanban");
  const [abaAtiva, setAbaAtiva] = useState<StatusLead>("novo");
  const [atualizando, setAtualizando] = useState<Set<string>>(new Set());

  // --- Filtros da lista ---
  const [busca, setBusca] = useState("");
  const [buscaDebounced, setBuscaDebounced] = useState("");
  const [statusFiltro, setStatusFiltro] = useState<StatusLead | "todos">("todos");
  const [page, setPage] = useState(1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ---------------------------------------------------------------------------
  // Carrega kanban (uma unica vez)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    fetch("/api/consultor/leads")
      .then((r) => {
        if (!r.ok) throw new Error("Erro ao carregar leads");
        return r.json() as Promise<Lead[]>;
      })
      .then((data) => setLeadsKanban(data))
      .catch((e: Error) => setErroKanban(e.message))
      .finally(() => setCarregandoKanban(false));
  }, []);

  // ---------------------------------------------------------------------------
  // Debounce da busca na lista
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setBuscaDebounced(busca);
      setPage(1); // volta p/ pagina 1 ao mudar busca
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [busca]);

  // ---------------------------------------------------------------------------
  // Carrega lista paginada
  // ---------------------------------------------------------------------------
  const carregarLista = useCallback(async () => {
    setCarregandoLista(true);
    setErroLista(null);
    const params = new URLSearchParams({
      page: String(page),
      limit: String(LIMIT),
    });
    if (statusFiltro !== "todos") params.set("status", statusFiltro);
    if (buscaDebounced) params.set("busca", buscaDebounced);

    try {
      const res = await fetch(`/api/consultor/leads?${params.toString()}`);
      if (!res.ok) throw new Error("Erro ao carregar leads");
      const json = await res.json() as { leads: Lead[]; total: number; page: number; limit: number };
      setLeadsLista(json.leads);
      setTotalLista(json.total);
    } catch (e: unknown) {
      setErroLista(e instanceof Error ? e.message : "Erro desconhecido");
    } finally {
      setCarregandoLista(false);
    }
  }, [page, statusFiltro, buscaDebounced]);

  useEffect(() => {
    if (visao === "lista") {
      void carregarLista();
    }
  }, [visao, carregarLista]);

  // ---------------------------------------------------------------------------
  // Filtro kanban (client-side, sem busca server)
  // ---------------------------------------------------------------------------
  const leadsKanbanFiltrados = useMemo(() => {
    const q = busca.toLowerCase().trim();
    if (!q) return leadsKanban;
    return leadsKanban.filter((l) => {
      const placa = (l.placa ?? "").toLowerCase();
      const nome = (l.nome_lead ?? "").toLowerCase();
      const ind = (l.indicadores?.nome ?? "").toLowerCase();
      return placa.includes(q) || nome.includes(q) || ind.includes(q);
    });
  }, [leadsKanban, busca]);

  // ---------------------------------------------------------------------------
  // Mutacoes
  // ---------------------------------------------------------------------------
  function registrarPagamento(leadId: string, valorPago: number | null, comprovanteUrl: string | null) {
    const patch = (l: Lead) =>
      l.id === leadId ? { ...l, pago_em: new Date().toISOString(), valor_pago: valorPago, comprovante_url: comprovanteUrl } : l;
    setLeadsKanban((prev) => prev.map(patch));
    setLeadsLista((prev) => prev.map(patch));
  }

  async function mudarStatus(id: string, status: StatusLead) {
    setAtualizando((prev) => new Set(prev).add(id));
    try {
      const res = await fetch(`/api/consultor/lead/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Falha ao atualizar");

      const json = await res.json() as {
        ok: boolean;
        indicador?: { nome: string; telefone: string | null; chave_pix: string | null; comissao: number | null };
      };

      const patch = (l: Lead) => (l.id === id ? { ...l, status } : l);
      setLeadsKanban((prev) => prev.map(patch));
      setLeadsLista((prev) => prev.map(patch));

      // Abre WhatsApp para o indicador quando venda e fechada
      if (status === "fechado" && json.indicador?.telefone) {
        const lead = leadsKanban.find((l) => l.id === id) ?? leadsLista.find((l) => l.id === id);
        const { nome, telefone, chave_pix, comissao } = json.indicador;
        const placa = lead?.placa ?? "";
        const comissaoTexto = comissao
          ? comissao.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
          : "a combinar";
        const pixTexto = chave_pix ?? "nao cadastrada";
        const tel = telefone.replace(/\D/g, "");
        const texto = encodeURIComponent(
          `Oi ${nome}, sua indicacao da placa ${placa} fechou! Voce ganhou ${comissaoTexto}. Sua chave PIX e ${pixTexto}.`
        );
        window.open(`https://wa.me/55${tel}?text=${texto}`, "_blank");
      }
    } catch {
      // falha silenciosa; usuario pode tentar novamente
    } finally {
      setAtualizando((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Paginacao
  // ---------------------------------------------------------------------------
  const totalPages = Math.max(1, Math.ceil(totalLista / LIMIT));

  function mudarStatusFiltro(s: StatusLead | "todos") {
    setStatusFiltro(s);
    setPage(1);
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const carregando = visao === "kanban" ? carregandoKanban : false;
  const erro = visao === "kanban" ? erroKanban : erroLista;

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Cabecalho */}
      <div className="px-4 md:px-8 py-4 border-b border-border flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-base font-bold text-foreground">
            Minhas Placas
            {visao === "kanban" && !carregandoKanban && (
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                ({leadsKanbanFiltrados.length})
              </span>
            )}
            {visao === "lista" && !carregandoLista && (
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                ({totalLista})
              </span>
            )}
          </h1>
          <p className="text-[11px] text-muted-foreground mt-0.5">Gestao de indicacoes recebidas</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar placa ou nome..."
            className="text-sm border border-border rounded-lg px-3 py-1.5 bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring w-52"
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
        // Visao Lista (paginada, server-side)
        // ---------------------------------------------------------------
        <div className="flex-1 flex flex-col min-h-0">
          {/* Filtro por status */}
          <div className="px-4 md:px-8 py-2 border-b border-border flex items-center gap-1.5 flex-wrap">
            {([
              { key: "todos" as const, label: "Todos" },
              ...COLUNAS.map((c) => ({ key: c.key, label: c.label })),
            ]).map((item) => (
              <button
                key={item.key}
                onClick={() => mudarStatusFiltro(item.key)}
                className={`text-xs font-semibold px-3 py-1 rounded-full border transition-colors
                  ${statusFiltro === item.key
                    ? "bg-foreground text-background border-foreground"
                    : "border-border text-muted-foreground hover:bg-muted"
                  }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Tabela */}
          <div className="flex-1 overflow-auto p-4 md:p-8 pb-0">
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
                  {carregandoLista ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>
                        <td colSpan={7} className="p-0">
                          <LeadSkeleton />
                        </td>
                      </tr>
                    ))
                  ) : !leadsLista.length ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-sm text-muted-foreground">
                        Nenhuma indicacao encontrada
                      </td>
                    </tr>
                  ) : (
                    leadsLista.map((lead, i) => {
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
                            <div className="flex items-center gap-2">
                              {lead.telefone_lead && (
                                <AbrirWhatsApp telefone={lead.telefone_lead} nome={lead.nome_lead ?? lead.placa ?? ""} />
                              )}
                              {lead.status === "fechado" && lead.indicadores?.nome && (
                                lead.comissao_paga ? (
                                  <div className="flex flex-col">
                                    <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">Comissao paga</span>
                                    {lead.comissao_paga_em && (
                                      <span className="text-[10px] text-muted-foreground">
                                        {new Date(lead.comissao_paga_em).toLocaleString("pt-BR")}
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <BotaoPagarComissao lead={lead} onPago={(leadId) => {
                                    const patch = (l: Lead) =>
                                      l.id === leadId ? { ...l, comissao_paga: true, comissao_paga_em: new Date().toISOString() } : l;
                                    setLeadsLista((prev) => prev.map(patch));
                                  }} />
                                )
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Rodape paginacao */}
          <div className="flex items-center justify-between px-4 md:px-8 py-3 border-t border-border text-sm">
            <span className="text-muted-foreground">{totalLista} lead{totalLista !== 1 ? "s" : ""}</span>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 1 || carregandoLista}
                onClick={() => setPage((p) => p - 1)}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <span className="font-medium text-xs text-foreground min-w-[60px] text-center">
                {page} / {totalPages}
              </span>
              <button
                disabled={page >= totalPages || carregandoLista}
                onClick={() => setPage((p) => p + 1)}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Proximo
              </button>
            </div>
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
              const qtd = leadsKanbanFiltrados.filter((l) => l.status === col.key).length;
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
              const leadsColuna = leadsKanbanFiltrados.filter((l) => l.status === col.key);
              return (
                <div
                  key={col.key}
                  className={`flex-shrink-0 w-full md:w-72 flex flex-col min-h-0 ${col.key !== abaAtiva ? "hidden md:flex" : "flex"}`}
                >
                  {/* Cabecalho coluna */}
                  <div className="flex items-center gap-2 mb-3 px-1">
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
                          onPago={registrarPagamento}
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
