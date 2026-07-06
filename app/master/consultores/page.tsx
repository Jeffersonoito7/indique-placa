"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { Users, UserCheck, UserX, Pencil, Trash2, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";

type Consultor = {
  id: string;
  nome: string;
  fone: string;
  email: string;
  cidade: string;
  associacao: string;
  status: string;
  created_at: string;
};

const statusStyle: Record<string, string> = {
  ativo: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  inativo: "bg-red-500/10 text-red-600 dark:text-red-400",
};

export default function ConsultoresPage() {
  const [lista, setLista] = useState<Consultor[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [editando, setEditando] = useState<Consultor | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [excluindo, setExcluindo] = useState<string | null>(null);
  const [erro, setErro] = useState("");

  const carregar = async () => {
    setCarregando(true);
    const res = await fetch("/api/master/consultores");
    const json = await res.json();
    setLista(json.lista ?? []);
    setCarregando(false);
  };

  useEffect(() => { carregar(); }, []);

  const salvarEdicao = async () => {
    if (!editando) return;
    setSalvando(true);
    setErro("");
    const res = await fetch(`/api/master/consultor/${editando.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome: editando.nome,
        fone: editando.fone,
        cidade: editando.cidade,
        associacao: editando.associacao,
        status: editando.status,
      }),
    });
    if (res.ok) { setEditando(null); carregar(); }
    else { const j = await res.json(); setErro(j.error ?? "Erro ao salvar"); }
    setSalvando(false);
  };

  const excluir = async (id: string, nome: string) => {
    if (!confirm(`Excluir o consultor "${nome}"? Esta ação não pode ser desfeita.`)) return;
    setExcluindo(id);
    await fetch(`/api/master/consultor/${id}`, { method: "DELETE" });
    setExcluindo(null);
    carregar();
  };

  const ativos  = lista.filter((c) => c.status === "ativo").length;
  const inativos = lista.filter((c) => c.status !== "ativo").length;

  return (
    <div className="flex-1 flex flex-col">
      <div className="px-8 py-5 border-b border-border">
        <h1 className="text-base font-bold text-foreground">Consultores</h1>
        <p className="text-[11px] text-muted-foreground mt-0.5">Gestão de consultores cadastrados na plataforma</p>
      </div>

      <div className="flex-1 p-8 bg-muted/30">
        {/* Resumo */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Total", val: lista.length, color: "blue",    Icon: Users },
            { label: "Ativos",  val: ativos,      color: "emerald", Icon: UserCheck },
            { label: "Inativos",val: inativos,    color: "red",     Icon: UserX },
          ].map(({ label, val, color, Icon }) => (
            <div key={label} className={`rounded-xl border-t-4 border-t-${color}-500 bg-card shadow-sm p-5 flex items-center gap-4`}>
              <div className={`w-10 h-10 rounded-xl bg-${color}-500/10 flex items-center justify-center flex-shrink-0`}>
                <Icon className={`h-5 w-5 text-${color}-500`} />
              </div>
              <div>
                <div className={`text-2xl font-bold text-${color}-500`}>{val}</div>
                <div className="text-xs text-muted-foreground">{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabela */}
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="text-sm font-semibold">Lista de Consultores</h2>
          </div>

          {carregando ? (
            <div className="text-center text-muted-foreground text-sm py-16">Carregando...</div>
          ) : lista.length === 0 ? (
            <div className="text-center text-muted-foreground text-sm py-16">Nenhum consultor cadastrado ainda</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    {["Nome", "Telefone", "Empresa", "Cidade", "Status", "Cadastro", "Ações"].map((h) => (
                      <th key={h} className="text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-5 py-3">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {lista.map((c, i) => (
                    <tr key={c.id} className={cn("border-b border-border hover:bg-accent/40 transition-colors", i % 2 !== 0 && "bg-muted/20")}>
                      <td className="px-5 py-3 text-sm font-medium text-foreground">{c.nome}</td>
                      <td className="px-5 py-3 text-sm text-muted-foreground font-mono">{c.fone ?? "-"}</td>
                      <td className="px-5 py-3 text-sm text-muted-foreground">{c.associacao || "-"}</td>
                      <td className="px-5 py-3 text-sm text-muted-foreground">{c.cidade || "-"}</td>
                      <td className="px-5 py-3">
                        <span className={cn("text-[11px] font-semibold px-2.5 py-1 rounded-full", statusStyle[c.status] ?? "bg-muted text-muted-foreground")}>
                          {c.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs text-muted-foreground">
                        {new Date(c.created_at).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => { setEditando({ ...c }); setErro(""); }}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10 transition-colors"
                            title="Editar"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => excluir(c.id, c.nome)}
                            disabled={excluindo === c.id}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                            title="Excluir"
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
        </div>
      </div>

      {/* Modal de edicao */}
      {editando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold">Editar Consultor</h3>
              <button onClick={() => setEditando(null)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            {erro && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 text-xs text-red-500 mb-4">{erro}</div>
            )}

            <div className="space-y-3">
              {[
                { label: "Nome", field: "nome" as const, type: "text" },
                { label: "Telefone", field: "fone" as const, type: "tel" },
                { label: "Nome da empresa", field: "associacao" as const, type: "text" },
                { label: "Cidade", field: "cidade" as const, type: "text" },
              ].map(({ label, field, type }) => (
                <div key={field}>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{label}</label>
                  <input
                    type={type}
                    value={(editando as any)[field] ?? ""}
                    onChange={(e) => setEditando({ ...editando, [field]: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              ))}

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Status</label>
                <select
                  value={editando.status}
                  onChange={(e) => setEditando({ ...editando, status: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm outline-none focus:border-blue-500"
                >
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setEditando(null)}
                className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold hover:bg-muted transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={salvarEdicao}
                disabled={salvando}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Check className="h-4 w-4" />
                {salvando ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
