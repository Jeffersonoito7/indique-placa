"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Users, UserCheck, UserX, Pencil, X, Check, ArrowLeftRight, ExternalLink,
} from "lucide-react";

interface Associacao { id: string; nome: string }

interface Consultor {
  id: string;
  nome: string;
  email: string;
  fone: string;
  status: string;
  plano: string | null;
  created_at: string;
  associacao: string | null;
  associacao_id: string | null;
  gestor: string | null;
  gestor_id: string | null;
  total_leads: number;
  total_fechados: number;
}

const statusStyle: Record<string, string> = {
  ativo: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  inativo: "bg-red-500/10 text-red-600 dark:text-red-400",
};

const planoStyle: Record<string, string> = {
  trial: "bg-amber-500/10 text-amber-500",
  basico: "bg-slate-500/10 text-slate-500",
  pro: "bg-violet-500/10 text-violet-500",
  enterprise: "bg-blue-500/10 text-blue-500",
};

function ModalRedistribuir({
  consultor,
  consultores,
  onClose,
  onFeito,
}: {
  consultor: Consultor;
  consultores: Consultor[];
  onClose: () => void;
  onFeito: () => void;
}) {
  const [destino, setDestino] = useState("");
  const [motivo, setMotivo] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const opcoes = consultores.filter(
    (c) => c.id !== consultor.id && c.status === "ativo" &&
      (!consultor.associacao_id || c.associacao_id === consultor.associacao_id)
  );

  const confirmar = async () => {
    if (!destino) return;
    setSalvando(true);
    setErro("");

    const resLeads = await fetch(`/api/master/leads?consultor_id=${consultor.id}&limit=200`);
    if (!resLeads.ok) { setErro("Erro ao buscar leads"); setSalvando(false); return; }
    const { lista } = await resLeads.json();

    if (!lista?.length) { setErro("Este consultor nao tem leads para redistribuir"); setSalvando(false); return; }

    const res = await fetch("/api/master/leads/transferir", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        indicacao_ids: lista.map((l: { id: string }) => l.id),
        consultor_destino_id: destino,
        motivo,
      }),
    });
    setSalvando(false);
    if (!res.ok) { const j = await res.json(); setErro(j.error ?? "Erro ao transferir"); return; }
    onFeito();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-sm font-bold">Redistribuir Carteira</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-accent transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-6 flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Todos os leads de <span className="font-semibold text-foreground">{consultor.nome}</span> ({consultor.total_leads} leads) serao transferidos.
          </p>
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Consultor Destino</label>
            <select
              className="w-full h-9 px-3 rounded-lg border border-border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40"
              value={destino}
              onChange={(e) => setDestino(e.target.value)}
            >
              <option value="">Selecione...</option>
              {opcoes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
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

export default function ConsultoresPage() {
  const [lista, setLista] = useState<Consultor[]>([]);
  const [associacoes, setAssociacoes] = useState<Associacao[]>([]);
  const [filtroAssoc, setFiltroAssoc] = useState("");
  const [filtroGestor, setFiltroGestor] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [editando, setEditando] = useState<Consultor | null>(null);
  const [redistribuindo, setRedistribuindo] = useState<Consultor | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const carregar = async () => {
    const params = new URLSearchParams();
    if (filtroAssoc) params.set("associacao_id", filtroAssoc);
    if (filtroStatus) params.set("status", filtroStatus);
    const res = await fetch(`/api/master/consultores?${params}`);
    if (res.ok) {
      const json = await res.json();
      setLista(json.lista ?? []);
    }
  };

  useEffect(() => { carregar(); }, [filtroAssoc, filtroGestor, filtroStatus]);

  useEffect(() => {
    fetch("/api/master/associacoes").then((r) => r.json()).then((j) => setAssociacoes(j.lista ?? []));
  }, []);

  const salvarEdicao = async () => {
    if (!editando) return;
    setSalvando(true);
    setErro("");
    const res = await fetch(`/api/master/consultor/${editando.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: editando.status }),
    });
    setSalvando(false);
    if (res.ok) { setEditando(null); carregar(); }
    else { const j = await res.json(); setErro(j.error ?? "Erro ao salvar"); }
  };

  const ativos = lista.filter((c) => c.status === "ativo").length;
  const inativos = lista.filter((c) => c.status !== "ativo").length;

  return (
    <div className="flex-1 flex flex-col">
      <div className="px-8 py-5 border-b border-border">
        <h1 className="text-base font-bold text-foreground">Consultores</h1>
        <p className="text-[11px] text-muted-foreground mt-0.5">Gestao de consultores da plataforma</p>
      </div>

      <div className="flex-1 p-8 bg-muted/30">
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Total", value: lista.length, icon: Users, color: "blue" },
            { label: "Ativos", value: ativos, icon: UserCheck, color: "emerald" },
            { label: "Inativos", value: inativos, icon: UserX, color: "red" },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label} className={`border-t-4 border-t-${color}-500`}>
              <CardContent className="p-5 flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl bg-${color}-500/10 flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`h-4 w-4 text-${color}-500`} />
                </div>
                <div>
                  <div className={`text-2xl font-bold text-${color}-500`}>{value}</div>
                  <div className="text-[10px] text-muted-foreground">{label}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="shadow-sm">
          <CardHeader className="pb-3 border-b border-border">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <CardTitle className="text-sm font-semibold">Lista de Consultores</CardTitle>
              <div className="flex items-center gap-3">
                <select
                  className="h-8 px-2 text-xs rounded-lg border border-border bg-muted/30 focus:outline-none"
                  value={filtroAssoc}
                  onChange={(e) => setFiltroAssoc(e.target.value)}
                >
                  <option value="">Todas as associacoes</option>
                  {associacoes.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
                </select>
                <select
                  className="h-8 px-2 text-xs rounded-lg border border-border bg-muted/30 focus:outline-none"
                  value={filtroStatus}
                  onChange={(e) => setFiltroStatus(e.target.value)}
                >
                  <option value="">Todos os status</option>
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {lista.length === 0 ? (
              <div className="text-center text-muted-foreground text-sm py-16">Nenhum consultor encontrado</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      {["Nome", "Email", "Associacao", "Gestor", "Plano", "Status", "Leads", "Fechados", "Cadastro", ""].map((h, i) => (
                        <th key={i} className="text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-4 py-3 whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {lista.map((c, i) => (
                      <tr key={c.id} className={cn("border-b border-border hover:bg-accent/40 transition-colors", i % 2 !== 0 && "bg-muted/20")}>
                        <td className="px-4 py-3 text-sm font-medium text-foreground whitespace-nowrap">{c.nome}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{c.email ?? "-"}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">{c.associacao ?? "-"}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">{c.gestor ?? "-"}</td>
                        <td className="px-4 py-3">
                          <span className={cn("text-[11px] font-semibold px-2.5 py-1 rounded-full", planoStyle[c.plano ?? ""] ?? "bg-muted text-muted-foreground")}>
                            {c.plano ?? "-"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn("text-[11px] font-semibold px-2.5 py-1 rounded-full", statusStyle[c.status] ?? "bg-muted text-muted-foreground")}>
                            {c.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-center text-muted-foreground">{c.total_leads}</td>
                        <td className="px-4 py-3 text-sm text-center text-emerald-500 font-semibold">{c.total_fechados}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(c.created_at).toLocaleDateString("pt-BR")}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => { setEditando({ ...c }); setErro(""); }}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10 transition-colors"
                              title="Editar status"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <a
                              href={`/master/leads?consultor_id=${c.id}`}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-violet-500 hover:bg-violet-500/10 transition-colors"
                              title="Ver leads"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                            {c.total_leads > 0 && (
                              <button
                                onClick={() => setRedistribuindo(c)}
                                className="p-1.5 rounded-lg text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10 transition-colors"
                                title="Redistribuir carteira"
                              >
                                <ArrowLeftRight className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {editando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-bold">Editar Consultor</h3>
              <button onClick={() => setEditando(null)} className="p-1.5 rounded-lg hover:bg-accent transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            {erro && <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 text-xs text-red-500 mb-4">{erro}</div>}
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Status</label>
              <select
                value={editando.status}
                onChange={(e) => setEditando({ ...editando, status: e.target.value })}
                className="w-full h-9 px-3 rounded-lg border border-border bg-muted/30 text-sm focus:outline-none"
              >
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
              </select>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setEditando(null)}
                className="flex-1 h-9 rounded-xl border border-border text-sm font-semibold hover:bg-muted transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={salvarEdicao}
                disabled={salvando}
                className="flex-1 h-9 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Check className="h-4 w-4" />
                {salvando ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {redistribuindo && (
        <ModalRedistribuir
          consultor={redistribuindo}
          consultores={lista}
          onClose={() => setRedistribuindo(null)}
          onFeito={carregar}
        />
      )}
    </div>
  );
}
