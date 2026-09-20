"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, Plus, Search, X, Network } from "lucide-react";
import { cn } from "@/lib/utils";

type Gestor = {
  id: string;
  nome: string;
  email: string;
  fone: string;
  ativo: boolean;
  criado_em: string;
  parceiros_habilitado: boolean;
};

function fmtTelBR(v: string): string {
  const n = v.replace(/\D/g, "").slice(0, 11);
  if (n.length <= 2) return n.length ? `(${n}` : "";
  if (n.length <= 6) return `(${n.slice(0, 2)}) ${n.slice(2)}`;
  if (n.length <= 10) return `(${n.slice(0, 2)}) ${n.slice(2, 6)}-${n.slice(6)}`;
  return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`;
}

export default function AssociacaoGestoresPage() {
  const router = useRouter();
  const [gestores, setGestores] = useState<Gestor[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erroModal, setErroModal] = useState("");
  const [form, setForm] = useState({ nome: "", email: "", fone: "", senha: "" });
  const [editando, setEditando] = useState<Gestor | null>(null);
  const [formEdit, setFormEdit] = useState({ nome: "", email: "", fone: "", nova_senha: "", parceiros_habilitado: false });
  const [enviandoEdit, setEnviandoEdit] = useState(false);
  const [erroEdit, setErroEdit] = useState("");

  async function carregar() {
    setCarregando(true);
    try {
      const res = await fetch("/api/associacao/gestores");
      if (res.ok) setGestores(await res.json());
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => { carregar(); }, []);

  const filtrados = gestores.filter((g) =>
    g.nome.toLowerCase().includes(busca.toLowerCase()) ||
    g.email.toLowerCase().includes(busca.toLowerCase())
  );

  async function adicionar(e: React.FormEvent) {
    e.preventDefault();
    setErroModal("");
    setEnviando(true);
    try {
      const res = await fetch("/api/associacao/gestores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, fone: form.fone.replace(/\D/g, "") }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setErroModal(err.error ?? "Erro ao adicionar gestor");
      } else {
        setModalAberto(false);
        setForm({ nome: "", email: "", fone: "", senha: "" });
        await carregar();
      }
    } catch {
      setErroModal("Erro de conexão.");
    } finally {
      setEnviando(false);
    }
  }

  function gerarSenhaAleatoria() {
    const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
    return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  }

  function abrirEdicao(g: Gestor) {
    setEditando(g);
    setFormEdit({ nome: g.nome, email: g.email ?? "", fone: g.fone ?? "", nova_senha: "", parceiros_habilitado: g.parceiros_habilitado ?? false });
    setErroEdit("");
  }

  async function salvarEdicao(e: React.FormEvent) {
    e.preventDefault();
    if (!editando) return;
    setErroEdit("");
    setEnviandoEdit(true);
    try {
      const body: Record<string, unknown> = {
        nome: formEdit.nome,
        email: formEdit.email,
        fone: formEdit.fone.replace(/\D/g, ""),
        parceiros_habilitado: formEdit.parceiros_habilitado,
      };
      if (formEdit.nova_senha) body.nova_senha = formEdit.nova_senha;
      const res = await fetch(`/api/associacao/gestores/${editando.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setErroEdit(err.error ?? "Erro ao salvar alterações");
      } else {
        setEditando(null);
        await carregar();
      }
    } catch {
      setErroEdit("Erro de conexão.");
    } finally {
      setEnviandoEdit(false);
    }
  }

  async function toggleAtivo(g: Gestor) {
    try {
      await fetch(`/api/associacao/gestores/${g.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ativo: !g.ativo }),
      });
    } catch {
      // falha silenciosa; recarrega para refletir estado real
    }
    await carregar();
  }

  async function deletar(g: Gestor) {
    if (!confirm(`Deletar ${g.nome}? Esta ação desvincula os consultores do gestor.`)) return;
    try {
      await fetch(`/api/associacao/gestores/${g.id}`, { method: "DELETE" });
    } catch {
      // falha silenciosa; recarrega para refletir estado real
    }
    await carregar();
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="px-8 py-5 border-b border-border flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-foreground">Gestores</h1>
          <p className="text-[11px] text-muted-foreground mt-0.5">Gerencie os gestores da associação</p>
        </div>
        <button
          onClick={() => { setModalAberto(true); setErroModal(""); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors"
        >
          <Plus className="h-4 w-4" />
          Adicionar Gestor
        </button>
      </div>

      <div className="flex-1 p-8 bg-muted/30 space-y-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por nome ou email..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-background border border-border rounded-xl outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        <Card className="shadow-sm">
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-indigo-500" />
              Gestores ({filtrados.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {carregando ? (
              <div className="text-center text-muted-foreground text-sm py-10">Carregando...</div>
            ) : filtrados.length === 0 ? (
              <div className="text-center text-muted-foreground text-sm py-10">
                {busca ? "Nenhum resultado." : "Nenhum gestor cadastrado."}
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    {["Gestor", "Contato", "Status", "Ações"].map((h) => (
                      <th key={h} className="text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-5 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map((g, i) => (
                    <tr key={g.id} className={cn(
                      "border-b border-border transition-colors hover:bg-accent/40",
                      i % 2 !== 0 && "bg-muted/20"
                    )}>
                      <td className="px-5 py-3.5">
                        <div className="text-sm font-semibold text-foreground">{g.nome}</div>
                        <div className="text-[11px] text-muted-foreground">{g.email}</div>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-muted-foreground">
                        {g.fone ? fmtTelBR(g.fone) : <span className="italic text-muted-foreground/50">sem fone</span>}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={cn(
                          "text-[10px] font-semibold px-2.5 py-1 rounded-full",
                          g.ativo
                            ? "bg-emerald-500/10 text-emerald-500"
                            : "bg-red-500/10 text-red-500"
                        )}>
                          {g.ativo ? "Ativo" : "Inativo"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => router.push(`/associacao/gestores/${g.id}/rede`)}
                            className="text-[11px] font-semibold px-3 py-1.5 rounded-lg border border-primary/30 text-primary hover:bg-primary/10 transition-colors flex items-center gap-1"
                          >
                            <Network className="w-3 h-3" />
                            Ver rede
                          </button>
                          <button
                            onClick={() => abrirEdicao(g)}
                            className="text-[11px] font-semibold px-3 py-1.5 rounded-lg border border-indigo-500/30 text-indigo-500 hover:bg-indigo-500/10 transition-colors"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => toggleAtivo(g)}
                            className={cn(
                              "text-[11px] font-semibold px-3 py-1.5 rounded-lg border transition-colors",
                              g.ativo
                                ? "border-red-500/30 text-red-500 hover:bg-red-500/10"
                                : "border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10"
                            )}
                          >
                            {g.ativo ? "Desativar" : "Ativar"}
                          </button>
                          <button
                            onClick={() => deletar(g)}
                            className="text-[11px] font-semibold px-3 py-1.5 rounded-lg border border-red-900/40 text-red-400 hover:bg-red-500/10 transition-colors"
                          >
                            Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>

      {editando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-foreground">Editar Gestor</h2>
              <button onClick={() => setEditando(null)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            {erroEdit && (
              <div className="mb-4 rounded-xl p-3 bg-red-500/10 border border-red-500/30 text-red-500 text-sm">
                {erroEdit}
              </div>
            )}

            <form onSubmit={salvarEdicao} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Nome</label>
                <input
                  type="text"
                  required
                  value={formEdit.nome}
                  onChange={(e) => setFormEdit((f) => ({ ...f, nome: e.target.value }))}
                  className="mt-1 w-full px-3 py-2.5 text-sm bg-muted border border-border rounded-xl outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">E-mail</label>
                <input
                  type="text"
                  inputMode="email"
                  value={formEdit.email}
                  onChange={(e) => setFormEdit((f) => ({ ...f, email: e.target.value }))}
                  className="mt-1 w-full px-3 py-2.5 text-sm bg-muted border border-border rounded-xl outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Telefone</label>
                <input
                  type="tel"
                  value={formEdit.fone}
                  onChange={(e) => setFormEdit((f) => ({ ...f, fone: fmtTelBR(e.target.value) }))}
                  className="mt-1 w-full px-3 py-2.5 text-sm bg-muted border border-border rounded-xl outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Nova senha (opcional)</label>
                  <button
                    type="button"
                    onClick={() => setFormEdit((f) => ({ ...f, nova_senha: gerarSenhaAleatoria() }))}
                    className="text-[10px] font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    Gerar senha
                  </button>
                </div>
                <input
                  type="text"
                  minLength={6}
                  placeholder="Deixe em branco para manter a atual"
                  value={formEdit.nova_senha}
                  onChange={(e) => setFormEdit((f) => ({ ...f, nova_senha: e.target.value }))}
                  className="w-full px-3 py-2.5 text-sm bg-muted border border-border rounded-xl outline-none focus:border-indigo-500 transition-colors font-mono"
                />
              </div>
              <div className="flex items-center justify-between py-3 border-t border-border">
                <div>
                  <p className="text-sm font-medium text-foreground">Buscar Parceiros</p>
                  <p className="text-xs text-muted-foreground">Habilitar acesso individual a este gestor</p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormEdit((f) => ({ ...f, parceiros_habilitado: !f.parceiros_habilitado }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formEdit.parceiros_habilitado ? "bg-[#00c389]" : "bg-muted-foreground/30"}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formEdit.parceiros_habilitado ? "translate-x-6" : "translate-x-1"}`} />
                </button>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditando(null)}
                  className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={enviandoEdit}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-sm font-semibold transition-colors"
                >
                  {enviandoEdit ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-foreground">Adicionar Gestor</h2>
              <button onClick={() => setModalAberto(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            {erroModal && (
              <div className="mb-4 rounded-xl p-3 bg-red-500/10 border border-red-500/30 text-red-500 text-sm">
                {erroModal}
              </div>
            )}

            <form onSubmit={adicionar} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Nome</label>
                <input
                  type="text"
                  required
                  placeholder="Nome completo"
                  value={form.nome}
                  onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                  className="mt-1 w-full px-3 py-2.5 text-sm bg-muted border border-border rounded-xl outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Email</label>
                <input
                  type="text" inputMode="email"
                  required
                  placeholder="email@exemplo.com"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="mt-1 w-full px-3 py-2.5 text-sm bg-muted border border-border rounded-xl outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Telefone</label>
                <input
                  type="tel"
                  required
                  placeholder="(87) 99999-9999"
                  value={form.fone}
                  onChange={(e) => setForm((f) => ({ ...f, fone: fmtTelBR(e.target.value) }))}
                  className="mt-1 w-full px-3 py-2.5 text-sm bg-muted border border-border rounded-xl outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Senha inicial</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Mínimo 6 caracteres"
                  value={form.senha}
                  onChange={(e) => setForm((f) => ({ ...f, senha: e.target.value }))}
                  className="mt-1 w-full px-3 py-2.5 text-sm bg-muted border border-border rounded-xl outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={enviando}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-sm font-semibold transition-colors"
                >
                  {enviando ? "Salvando..." : "Adicionar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
