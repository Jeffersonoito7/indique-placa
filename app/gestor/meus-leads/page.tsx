"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { Trash2, Plus, X, TrendingUp, Clock, CheckCircle, XCircle } from "lucide-react";
import { PlacaMercosul } from "@/components/placa-mercosul";
import { AbrirWhatsApp } from "@/components/abrir-whatsapp";

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

type StatusLead = "novo" | "contato" | "fechado" | "perdido";

interface Lead {
  id: string;
  placa: string | null;
  nome_lead: string | null;
  telefone_lead: string | null;
  status: StatusLead;
  criado_em: string;
  tipo_veiculo: string | null;
}

interface NovoLeadForm {
  placa: string;
  nome_lead: string;
  telefone_lead: string;
  tipo_veiculo: string;
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

const STATUS_COR: Record<StatusLead, string> = {
  novo: "bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400",
  contato: "bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400",
  fechado: "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400",
  perdido: "bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400",
};

// ---------------------------------------------------------------------------
// KPI Card
// ---------------------------------------------------------------------------

function KpiCard({
  label,
  valor,
  icone,
  corTexto,
}: {
  label: string;
  valor: string | number;
  icone: React.ReactNode;
  corTexto?: string;
}) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-border rounded-lg px-4 py-3 flex items-center gap-3 min-w-0">
      <div className="flex-shrink-0 text-muted-foreground">{icone}</div>
      <div className="min-w-0">
        <div className={`text-lg font-bold leading-tight ${corTexto ?? "text-foreground"}`}>{valor}</div>
        <div className="text-[11px] text-muted-foreground truncate">{label}</div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Modal Novo Lead
// ---------------------------------------------------------------------------

function ModalNovoLead({
  onFechar,
  onCriado,
}: {
  onFechar: () => void;
  onCriado: (lead: Lead) => void;
}) {
  const [form, setForm] = useState<NovoLeadForm>({
    placa: "",
    nome_lead: "",
    telefone_lead: "",
    tipo_veiculo: "carro",
  });
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  function setField(field: keyof NovoLeadForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function salvar() {
    if (!form.placa.trim()) {
      setErro("Informe a placa do veiculo");
      return;
    }
    setEnviando(true);
    setErro("");
    try {
      const res = await fetch("/api/gestor/meus-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          placa: form.placa.trim().toUpperCase(),
          nome_lead: form.nome_lead.trim() || null,
          telefone_lead: form.telefone_lead.trim() || null,
          tipo_veiculo: form.tipo_veiculo || null,
        }),
      });
      const json = await res.json() as Lead & { error?: string };
      if (!res.ok) {
        setErro(json.error ?? "Erro ao criar lead");
        return;
      }
      onCriado(json);
    } catch {
      setErro("Erro de conexao");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-background border border-border rounded-xl shadow-xl w-full max-w-sm">
        {/* Cabecalho modal */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-sm font-bold text-foreground">Novo Lead</h2>
          <button
            onClick={onFechar}
            className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Formulario */}
        <div className="px-5 py-4 space-y-3">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Placa *
            </label>
            <input
              type="text"
              value={form.placa}
              onChange={(e) => setField("placa", e.target.value.toUpperCase())}
              placeholder="ABC1D23"
              maxLength={8}
              className="w-full text-sm px-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring uppercase"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Nome do proprietario
            </label>
            <input
              type="text"
              value={form.nome_lead}
              onChange={(e) => setField("nome_lead", e.target.value)}
              placeholder="Nome completo"
              className="w-full text-sm px-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Telefone
            </label>
            <input
              type="tel"
              value={form.telefone_lead}
              onChange={(e) => setField("telefone_lead", e.target.value)}
              placeholder="(87) 99999-9999"
              className="w-full text-sm px-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Tipo de veiculo
            </label>
            <select
              value={form.tipo_veiculo}
              onChange={(e) => setField("tipo_veiculo", e.target.value)}
              className="w-full text-sm px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="carro">Carro</option>
              <option value="moto">Moto</option>
              <option value="caminhao">Caminhao</option>
              <option value="outro">Outro</option>
            </select>
          </div>

          {erro && <div className="text-xs text-red-500">{erro}</div>}
        </div>

        {/* Acoes */}
        <div className="flex gap-2 px-5 pb-5">
          <button
            onClick={onFechar}
            className="flex-1 text-sm py-2 rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => void salvar()}
            disabled={enviando}
            className="flex-1 text-sm font-bold py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-colors disabled:opacity-50"
          >
            {enviando ? "Criando..." : "Criar Lead"}
          </button>
        </div>
      </div>
    </div>
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

function LeadCard({
  lead,
  atualizando,
  apagando,
  onMudarStatus,
  onApagar,
}: {
  lead: Lead;
  atualizando: boolean;
  apagando: boolean;
  onMudarStatus: (id: string, status: StatusLead) => void;
  onApagar: (id: string) => void;
}) {
  const coluna = COLUNAS.find((c) => c.key === lead.status)!;
  const data = new Date(lead.criado_em).toLocaleDateString("pt-BR");

  return (
    <div
      className={`relative bg-white dark:bg-zinc-900 rounded-lg border border-border border-l-4 ${coluna.borda} p-3 shadow-sm transition-opacity ${atualizando || apagando ? "opacity-60" : "opacity-100"}`}
    >
      {/* Botao apagar */}
      <button
        onClick={() => onApagar(lead.id)}
        disabled={apagando || atualizando}
        className="absolute top-2 right-2 p-1 rounded text-muted-foreground hover:text-red-500 transition-colors disabled:opacity-40"
        title="Apagar lead"
      >
        <Trash2 size={14} />
      </button>

      {/* Placa */}
      <div className="mb-2 pr-6">
        {lead.placa ? (
          <PlacaMercosul placa={lead.placa} tamanho="sm" />
        ) : (
          <span className="text-xs text-muted-foreground italic">sem placa</span>
        )}
      </div>

      {/* Nome + tipo */}
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

      {/* Data + WhatsApp */}
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-[10px] text-muted-foreground">{data}</span>
        {lead.telefone_lead && (
          <AbrirWhatsApp telefone={lead.telefone_lead} nome={lead.nome_lead ?? lead.placa ?? ""} />
        )}
      </div>

      {/* Botoes de status */}
      <div className="flex flex-col gap-1.5 mt-1">
        {lead.status !== "fechado" && lead.status !== "perdido" && (
          <button
            disabled={atualizando}
            onClick={() => onMudarStatus(lead.id, "fechado")}
            className="w-full py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white text-xs font-bold transition-all"
          >
            Fechar venda
          </button>
        )}
        <div className="flex gap-1">
          {COLUNAS.filter((c) => c.key !== "fechado").map((col) => (
            <button
              key={col.key}
              disabled={atualizando || lead.status === col.key}
              onClick={() => onMudarStatus(lead.id, col.key)}
              title={col.label}
              className={`flex-1 text-[10px] font-bold py-1 rounded-lg transition-colors disabled:cursor-default
                ${lead.status === col.key
                  ? STATUS_COR[col.key] + " ring-1 ring-current"
                  : "bg-muted/40 hover:bg-muted text-muted-foreground"
                }`}
            >
              {col.key === "novo" ? "Novo" : col.key === "contato" ? "Contatado" : "Perdido"}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

const LIMIT = 20;

export default function GestorMeusLeadsPage() {
  // --- Estado kanban ---
  const [leadsKanban, setLeadsKanban] = useState<Lead[]>([]);
  const [carregandoKanban, setCarregandoKanban] = useState(true);
  const [erroKanban, setErroKanban] = useState<string | null>(null);

  // --- Estado lista ---
  const [leadsLista, setLeadsLista] = useState<Lead[]>([]);
  const [totalLista, setTotalLista] = useState(0);
  const [carregandoLista, setCarregandoLista] = useState(false);
  const [erroLista, setErroLista] = useState<string | null>(null);

  // --- Estado compartilhado ---
  const [visao, setVisao] = useState<"kanban" | "lista">("kanban");
  const [abaAtiva, setAbaAtiva] = useState<StatusLead>("novo");
  const [atualizando, setAtualizando] = useState<Set<string>>(new Set());
  const [apagando, setApagando] = useState<Set<string>>(new Set());
  const [modalAberto, setModalAberto] = useState(false);

  // --- Filtros da lista ---
  const [busca, setBusca] = useState("");
  const [buscaDebounced, setBuscaDebounced] = useState("");
  const [statusFiltro, setStatusFiltro] = useState<StatusLead | "todos">("todos");
  const [page, setPage] = useState(1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ---------------------------------------------------------------------------
  // Carrega kanban
  // ---------------------------------------------------------------------------
  useEffect(() => {
    fetch("/api/gestor/meus-leads")
      .then((r) => {
        if (!r.ok) throw new Error("Erro ao carregar leads");
        return r.json() as Promise<Lead[]>;
      })
      .then((data) => setLeadsKanban(data))
      .catch((e: Error) => setErroKanban(e.message))
      .finally(() => setCarregandoKanban(false));
  }, []);

  // ---------------------------------------------------------------------------
  // Debounce da busca
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setBuscaDebounced(busca);
      setPage(1);
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
      const res = await fetch(`/api/gestor/meus-leads?${params.toString()}`);
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
  // Filtro kanban client-side
  // ---------------------------------------------------------------------------
  const leadsKanbanFiltrados = useMemo(() => {
    const q = busca.toLowerCase().trim();
    if (!q) return leadsKanban;
    return leadsKanban.filter((l) => {
      const placa = (l.placa ?? "").toLowerCase();
      const nome = (l.nome_lead ?? "").toLowerCase();
      return placa.includes(q) || nome.includes(q);
    });
  }, [leadsKanban, busca]);

  // ---------------------------------------------------------------------------
  // KPIs
  // ---------------------------------------------------------------------------
  const kpis = useMemo(() => {
    const total = leadsKanban.length;
    const emAndamento = leadsKanban.filter((l) => l.status === "novo" || l.status === "contato").length;
    const fechados = leadsKanban.filter((l) => l.status === "fechado").length;
    const taxa = total > 0 ? Math.round((fechados / total) * 100) : 0;
    return { total, emAndamento, fechados, taxa };
  }, [leadsKanban]);

  // ---------------------------------------------------------------------------
  // Mutacoes
  // ---------------------------------------------------------------------------
  function adicionarLead(lead: Lead) {
    setLeadsKanban((prev) => [lead, ...prev]);
    setModalAberto(false);
  }

  async function mudarStatus(id: string, status: StatusLead) {
    setAtualizando((prev) => new Set(prev).add(id));
    try {
      const res = await fetch(`/api/gestor/meus-leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Falha ao atualizar");

      const patch = (l: Lead) => (l.id === id ? { ...l, status } : l);
      setLeadsKanban((prev) => prev.map(patch));
      setLeadsLista((prev) => prev.map(patch));
    } catch {
      setErroKanban("Erro ao mover o card. Verifique sua conexao e tente novamente.");
    } finally {
      setAtualizando((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }

  async function apagarLead(id: string) {
    const confirmado = window.confirm("Apagar este lead? Esta acao nao pode ser desfeita.");
    if (!confirmado) return;
    setApagando((prev) => new Set(prev).add(id));
    try {
      const res = await fetch(`/api/gestor/meus-leads/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json() as { error?: string };
        alert(json.error ?? "Erro ao apagar lead");
        return;
      }
      setLeadsKanban((prev) => prev.filter((l) => l.id !== id));
      setLeadsLista((prev) => prev.filter((l) => l.id !== id));
      setTotalLista((prev) => Math.max(0, prev - 1));
    } catch {
      alert("Erro de conexao");
    } finally {
      setApagando((prev) => {
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
      {/* Modal */}
      {modalAberto && (
        <ModalNovoLead onFechar={() => setModalAberto(false)} onCriado={adicionarLead} />
      )}

      {/* Cabecalho */}
      <div className="px-4 md:px-8 py-4 border-b border-border flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-base font-bold text-foreground">
            Meus Leads
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
          <p className="text-[11px] text-muted-foreground mt-0.5">Sua producao pessoal</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar placa ou nome..."
            className="text-sm border border-border rounded-lg px-3 py-1.5 bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring w-48"
          />
          <button
            onClick={() => setVisao((v) => (v === "kanban" ? "lista" : "kanban"))}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-muted transition-colors text-foreground"
          >
            {visao === "kanban" ? "Lista" : "Kanban"}
          </button>
          <button
            onClick={() => setModalAberto(true)}
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-colors"
          >
            <Plus size={14} />
            Novo Lead
          </button>
        </div>
      </div>

      {/* KPIs (so no kanban e quando carregado) */}
      {visao === "kanban" && !carregandoKanban && (
        <div className="px-4 md:px-8 py-3 border-b border-border grid grid-cols-2 md:grid-cols-4 gap-2">
          <KpiCard
            label="Total de leads"
            valor={kpis.total}
            icone={<TrendingUp size={16} />}
          />
          <KpiCard
            label="Em andamento"
            valor={kpis.emAndamento}
            icone={<Clock size={16} />}
            corTexto="text-amber-600 dark:text-amber-400"
          />
          <KpiCard
            label="Fechados"
            valor={kpis.fechados}
            icone={<CheckCircle size={16} />}
            corTexto="text-emerald-600 dark:text-emerald-400"
          />
          <KpiCard
            label="Taxa de conversao"
            valor={`${kpis.taxa}%`}
            icone={<XCircle size={16} />}
            corTexto={kpis.taxa >= 30 ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"}
          />
        </div>
      )}

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
                    {["Placa", "Proprietario", "Tipo", "Status", "Data", ""].map((h) => (
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
                        <td colSpan={6} className="p-0">
                          <LeadSkeleton />
                        </td>
                      </tr>
                    ))
                  ) : !leadsLista.length ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-sm text-muted-foreground">
                        Nenhum lead encontrado
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
                              <button
                                onClick={() => void apagarLead(lead.id)}
                                disabled={apagando.has(lead.id)}
                                className="p-1 rounded text-muted-foreground hover:text-red-500 transition-colors disabled:opacity-40"
                                title="Apagar lead"
                              >
                                <Trash2 size={14} />
                              </button>
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
                    style={{ maxHeight: "calc(100vh - 260px)" }}
                  >
                    {leadsColuna.length === 0 ? (
                      <div className="text-center text-xs text-muted-foreground py-10 border border-dashed border-border rounded-lg">
                        Nenhum lead aqui ainda
                      </div>
                    ) : (
                      leadsColuna.map((lead) => (
                        <LeadCard
                          key={lead.id}
                          lead={lead}
                          atualizando={atualizando.has(lead.id)}
                          apagando={apagando.has(lead.id)}
                          onMudarStatus={mudarStatus}
                          onApagar={apagarLead}
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
