"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { PlacaMercosul } from "@/components/placa-mercosul";
import {
  ClipboardList, Flame, CheckCircle2, XCircle, PhoneCall,
  ArrowLeftRight, Trash2, X, ChevronLeft, ChevronRight,
} from "lucide-react";

interface Associacao { id: string; nome: string }
interface Consultor { id: string; nome: string; associacao_id: string | null }
interface Lead {
  id: string;
  placa: string | null;
  nome_lead: string | null;
  telefone_lead: string | null;
  status: string;
  criado_em: string;
  consultor_id: string | null;
  consultores: { id: string; nome: string } | null;
  indicadores: { id: string; nome: string } | null;
  associacoes: { id: string; nome: string } | null;
  associacao_id: string | null;
}

const statusStyle: Record<string, string> = {
  novo: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  contato: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  fechado: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  perdido: "bg-red-500/10 text-red-600 dark:text-red-400",
};

function ModalTransferir({
  ids,
  consultor_origem_assoc,
  consultores,
  onClose,
  onFeito,
}: {
  ids: string[];
  consultor_origem_assoc: string | null;
  consultores: Consultor[];
  onClose: () => void;
  onFeito: () => void;
}) {
  const [destino, setDestino] = useState("");
  const [motivo, setMotivo] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const opcoes = consultores.filter(
    (c) => !consultor_origem_assoc || c.associacao_id === consultor_origem_assoc
  );

  const confirmar = async () => {
    if (!destino) return;
    setSalvando(true);
    setErro("");
    const res = await fetch("/api/master/leads/transferir", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ indicacao_ids: ids, consultor_destino_id: destino, motivo }),
    });
    setSalvando(false);
    if (!res.ok) {
      const json = await res.json();
      setErro(typeof json.error === "string" ? json.error : "Erro ao transferir");
      return;
    }
    onFeito();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-sm font-bold">Transferir Lead{ids.length > 1 ? "s" : ""}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-accent transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-6 flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            {ids.length} lead{ids.length > 1 ? "s" : ""} sera{ids.length > 1 ? "o" : ""} transferido{ids.length > 1 ? "s" : ""}.
          </p>
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Consultor Destino</label>
            <select
              className="w-full h-9 px-3 rounded-lg border border-border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40"
              value={destino}
              onChange={(e) => setDestino(e.target.value)}
            >
              <option value="">Selecione...</option>
              {opcoes.map((c) => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Motivo (opcional)</label>
            <textarea
              className="w-full px-3 py-2 rounded-lg border border-border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40 resize-none"
              rows={3}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
            />
          </div>
          {erro && <p className="text-xs text-red-500">{erro}</p>}
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
          <button onClick={onClose} className="h-9 px-4 rounded-lg text-sm font-medium text-muted-foreground hover:bg-accent transition-colors">
            Cancelar
          </button>
          <button
            onClick={confirmar}
            disabled={salvando || !destino}
            className="h-9 px-5 rounded-lg text-sm font-semibold bg-violet-500 text-white hover:bg-violet-600 disabled:opacity-50 transition-colors"
          >
            {salvando ? "Transferindo..." : "Confirmar"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LeadsCentralPage() {
  const [lista, setLista] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 50;

  const [associacoes, setAssociacoes] = useState<Associacao[]>([]);
  const [consultores, setConsultores] = useState<Consultor[]>([]);

  const [filtroAssoc, setFiltroAssoc] = useState("");
  const [filtroConsultor, setFiltroConsultor] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [filtroDe, setFiltroDe] = useState("");
  const [filtroAte, setFiltroAte] = useState("");

  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [modalTransferir, setModalTransferir] = useState<{ ids: string[]; assoc: string | null } | null>(null);

  const carregar = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (filtroAssoc) params.set("associacao_id", filtroAssoc);
    if (filtroConsultor) params.set("consultor_id", filtroConsultor);
    if (filtroStatus) params.set("status", filtroStatus);
    if (filtroDe) params.set("de", filtroDe);
    if (filtroAte) params.set("ate", filtroAte);

    const res = await fetch(`/api/master/leads?${params}`);
    if (res.ok) {
      const json = await res.json();
      setLista(json.lista ?? []);
      setTotal(json.total ?? 0);
    }
    setSelecionados(new Set());
  }, [page, filtroAssoc, filtroConsultor, filtroStatus, filtroDe, filtroAte]);

  useEffect(() => { carregar(); }, [carregar]);

  useEffect(() => {
    fetch("/api/master/associacoes").then((r) => r.json()).then((j) => setAssociacoes(j.lista ?? []));
    fetch("/api/master/consultores").then((r) => r.json()).then((j) => setConsultores(j.lista ?? []));
  }, []);

  const consultoresFiltrados = filtroAssoc
    ? consultores.filter((c) => c.associacao_id === filtroAssoc)
    : consultores;

  const toggleSelecionado = (id: string) => {
    setSelecionados((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleTodos = () => {
    if (selecionados.size === lista.length) {
      setSelecionados(new Set());
    } else {
      setSelecionados(new Set(lista.map((l) => l.id)));
    }
  };

  const apagarLead = async (id: string) => {
    if (!confirm("Apagar este lead permanentemente?")) return;
    await fetch(`/api/master/leads/${id}`, { method: "DELETE" });
    carregar();
  };

  const apagarSelecionados = async () => {
    if (!confirm(`Apagar ${selecionados.size} lead(s) permanentemente?`)) return;
    await Promise.all([...selecionados].map((id) => fetch(`/api/master/leads/${id}`, { method: "DELETE" })));
    carregar();
  };

  const totalPages = Math.ceil(total / limit);

  const assocDosSelecionados = () => {
    const ids = [...selecionados];
    if (ids.length === 0) return null;
    const primeiro = lista.find((l) => l.id === ids[0]);
    return primeiro?.associacao_id ?? null;
  };

  return (
    <div className="flex-1 flex flex-col">
      <div className="px-8 py-5 border-b border-border">
        <h1 className="text-base font-bold text-foreground">Central de Leads</h1>
        <p className="text-[11px] text-muted-foreground mt-0.5">Gestao completa de todos os leads da plataforma</p>
      </div>

      <div className="flex-1 p-8 bg-muted/30 flex flex-col gap-6">
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              <select
                className="h-9 px-3 text-sm rounded-lg border border-border bg-muted/30 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
                value={filtroAssoc}
                onChange={(e) => { setFiltroAssoc(e.target.value); setFiltroConsultor(""); setPage(1); }}
              >
                <option value="">Todas as associacoes</option>
                {associacoes.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
              </select>

              <select
                className="h-9 px-3 text-sm rounded-lg border border-border bg-muted/30 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
                value={filtroConsultor}
                onChange={(e) => { setFiltroConsultor(e.target.value); setPage(1); }}
              >
                <option value="">Todos os consultores</option>
                {consultoresFiltrados.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>

              <select
                className="h-9 px-3 text-sm rounded-lg border border-border bg-muted/30 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
                value={filtroStatus}
                onChange={(e) => { setFiltroStatus(e.target.value); setPage(1); }}
              >
                <option value="">Todos os status</option>
                <option value="novo">Novo</option>
                <option value="contato">Em Contato</option>
                <option value="fechado">Fechado</option>
                <option value="perdido">Perdido</option>
              </select>

              <input
                type="date"
                className="h-9 px-3 text-sm rounded-lg border border-border bg-muted/30 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
                value={filtroDe}
                onChange={(e) => { setFiltroDe(e.target.value); setPage(1); }}
                placeholder="De"
              />
              <input
                type="date"
                className="h-9 px-3 text-sm rounded-lg border border-border bg-muted/30 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
                value={filtroAte}
                onChange={(e) => { setFiltroAte(e.target.value); setPage(1); }}
                placeholder="Ate"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm flex-1">
          <CardHeader className="pb-3 border-b border-border">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <CardTitle className="text-sm font-semibold">
                Exibindo {lista.length} de {total} leads
              </CardTitle>

              {selecionados.size > 0 && (
                <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-violet-500/10 border border-violet-500/20">
                  <span className="text-xs font-semibold text-violet-500">{selecionados.size} selecionado{selecionados.size > 1 ? "s" : ""}</span>
                  <button
                    onClick={() => setModalTransferir({ ids: [...selecionados], assoc: assocDosSelecionados() })}
                    className="flex items-center gap-1.5 h-7 px-3 rounded-lg text-xs font-semibold bg-violet-500 text-white hover:bg-violet-600 transition-colors"
                  >
                    <ArrowLeftRight className="h-3 w-3" />
                    Transferir selecionados
                  </button>
                  <button
                    onClick={apagarSelecionados}
                    className="flex items-center gap-1.5 h-7 px-3 rounded-lg text-xs font-semibold bg-red-500 text-white hover:bg-red-600 transition-colors"
                  >
                    <Trash2 className="h-3 w-3" />
                    Apagar selecionados
                  </button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {lista.length === 0 ? (
              <div className="text-center text-muted-foreground text-sm py-16">Nenhum lead encontrado</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      <th className="px-4 py-3 w-10">
                        <input
                          type="checkbox"
                          className="rounded"
                          checked={selecionados.size === lista.length && lista.length > 0}
                          onChange={toggleTodos}
                        />
                      </th>
                      {["Placa", "Proprietario", "Telefone", "Consultor", "Indicador", "Associacao", "Status", "Data", ""].map((h, i) => (
                        <th key={i} className="text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-4 py-3 whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {lista.map((lead, i) => (
                      <tr
                        key={lead.id}
                        className={cn(
                          "border-b border-border hover:bg-accent/40 transition-colors",
                          i % 2 !== 0 && "bg-muted/20",
                          selecionados.has(lead.id) && "bg-violet-500/5"
                        )}
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            className="rounded"
                            checked={selecionados.has(lead.id)}
                            onChange={() => toggleSelecionado(lead.id)}
                          />
                        </td>
                        <td className="px-4 py-3">
                          {lead.placa
                            ? <PlacaMercosul placa={lead.placa} tamanho="sm" />
                            : <span className="text-xs text-muted-foreground italic">sem placa</span>}
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground whitespace-nowrap">
                          {lead.nome_lead ?? <span className="italic text-muted-foreground/50 text-xs">a preencher</span>}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground font-mono whitespace-nowrap">
                          {lead.telefone_lead ?? "-"}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                          {lead.consultores?.nome ?? "-"}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                          {lead.indicadores?.nome ?? "-"}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                          {lead.associacoes?.nome ?? "-"}
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn("text-[11px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap", statusStyle[lead.status] ?? "bg-muted text-muted-foreground")}>
                            {lead.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(lead.criado_em).toLocaleDateString("pt-BR")}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setModalTransferir({ ids: [lead.id], assoc: lead.associacao_id })}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-violet-500 hover:bg-violet-500/10 transition-colors"
                              title="Transferir"
                            >
                              <ArrowLeftRight className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => apagarLead(lead.id)}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                              title="Apagar"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
                <span className="text-xs text-muted-foreground">Pagina {page} de {totalPages}</span>
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 rounded-lg border border-border hover:bg-accent disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-1.5 rounded-lg border border-border hover:bg-accent disabled:opacity-40 transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {modalTransferir && (
        <ModalTransferir
          ids={modalTransferir.ids}
          consultor_origem_assoc={modalTransferir.assoc}
          consultores={consultores}
          onClose={() => setModalTransferir(null)}
          onFeito={carregar}
        />
      )}
    </div>
  );
}
