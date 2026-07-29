"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCheck, Trash2, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Indicador {
  id: string;
  nome: string;
  telefone: string | null;
  criado_em: string;
  consultores: { nome: string } | null;
}

interface Consultor {
  id: string;
  nome: string;
}

const VAZIO = { nome: "", telefone: "", email: "", senha: "", consultor_id: "" };

export default function IndicadoresPage() {
  const [lista, setLista] = useState<Indicador[]>([]);
  const [consultores, setConsultores] = useState<Consultor[]>([]);
  const [excluindo, setExcluindo] = useState<string | null>(null);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(VAZIO);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const carregar = async () => {
    const res = await fetch("/api/master/indicadores");
    if (res.ok) setLista(await res.json());
  };

  const carregarConsultores = async () => {
    const res = await fetch("/api/master/consultores");
    if (res.ok) {
      const data = await res.json();
      setConsultores(data ?? []);
    }
  };

  useEffect(() => { carregar(); carregarConsultores(); }, []);

  const abrirModal = () => { setForm(VAZIO); setErro(""); setModal(true); };
  const fecharModal = () => { setModal(false); setErro(""); };

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    if (form.senha.length < 6) { setErro("A senha deve ter no mínimo 6 caracteres."); return; }
    setSalvando(true);
    try {
      const res = await fetch("/api/master/indicadores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: form.nome,
          telefone: form.telefone,
          email: form.email,
          senha: form.senha,
          consultor_id: form.consultor_id || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) { setErro(json.error ?? "Erro ao cadastrar."); return; }
      fecharModal();
      carregar();
    } catch {
      setErro("Erro de conexão. Tente novamente.");
    } finally {
      setSalvando(false);
    }
  };

  const excluir = async (id: string, nome: string) => {
    if (!confirm(`Excluir o indicador "${nome}"? Esta ação não pode ser desfeita.`)) return;
    setExcluindo(id);
    const res = await fetch(`/api/master/indicador/${id}`, { method: "DELETE" });
    setExcluindo(null);
    if (!res.ok) {
      const json = await res.json();
      alert(json.error ?? "Erro ao excluir indicador.");
      return;
    }
    carregar();
  };

  return (
    <div className="flex-1 flex flex-col">
      <div className="px-8 py-5 border-b border-border flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-foreground">Indicadores</h1>
          <p className="text-[11px] text-muted-foreground mt-0.5">Captadores de leads vinculados aos consultores</p>
        </div>
        <button
          onClick={abrirModal}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          <Plus className="h-4 w-4" />
          Novo Indicador
        </button>
      </div>

      <div className="flex-1 p-8 bg-muted/30">
        <div className="grid grid-cols-2 gap-4 mb-8 max-w-sm">
          <Card className="border-t-4 border-t-violet-500">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                <UserCheck className="h-5 w-5 text-violet-500" />
              </div>
              <div>
                <div className="text-2xl font-bold text-violet-500">{lista.length}</div>
                <div className="text-xs text-muted-foreground">Total cadastrados</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-sm">
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle className="text-sm font-semibold">Lista de Indicadores</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {lista.length === 0 ? (
              <div className="text-center text-muted-foreground text-sm py-16">Nenhum indicador cadastrado ainda</div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    {["Nome", "Telefone", "Consultor vinculado", "Cadastro", ""].map((h, i) => (
                      <th key={i} className="text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-6 py-3">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {lista.map((ind, i) => (
                    <tr key={ind.id} className={cn("border-b border-border hover:bg-accent/40 transition-colors", i % 2 !== 0 && "bg-muted/20")}>
                      <td className="px-6 py-3.5 text-sm font-medium text-foreground">{ind.nome}</td>
                      <td className="px-6 py-3.5 text-sm text-muted-foreground font-mono">{ind.telefone ?? "-"}</td>
                      <td className="px-6 py-3.5 text-sm text-muted-foreground">
                        {ind.consultores?.nome ?? <span className="text-muted-foreground/50 italic">sem vínculo</span>}
                      </td>
                      <td className="px-6 py-3.5 text-xs text-muted-foreground">
                        {new Date(ind.criado_em).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="px-6 py-3.5">
                        <button
                          onClick={() => excluir(ind.id, ind.nome)}
                          disabled={excluindo === ind.id}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-40"
                          title="Excluir indicador"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-sm font-bold">Novo Indicador</h2>
              <button onClick={fecharModal} className="p-1.5 rounded-lg hover:bg-accent transition-colors">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
            <form onSubmit={salvar} className="px-6 py-5 space-y-4">
              {erro && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2.5 text-sm text-red-400">
                  {erro}
                </div>
              )}
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Nome completo</label>
                <input
                  className="mt-1.5 w-full px-3 py-2.5 rounded-lg border border-border bg-muted/40 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/40"
                  placeholder="Ex: Maria Silva"
                  value={form.nome}
                  required
                  onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">WhatsApp</label>
                <input
                  className="mt-1.5 w-full px-3 py-2.5 rounded-lg border border-border bg-muted/40 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/40"
                  placeholder="(87) 99999-9999"
                  type="tel"
                  value={form.telefone}
                  required
                  onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">E-mail</label>
                <input
                  className="mt-1.5 w-full px-3 py-2.5 rounded-lg border border-border bg-muted/40 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/40"
                  placeholder="email@exemplo.com"
                  type="email"
                  value={form.email}
                  required
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Senha de acesso</label>
                <input
                  className="mt-1.5 w-full px-3 py-2.5 rounded-lg border border-border bg-muted/40 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/40"
                  placeholder="Mínimo 6 caracteres"
                  type="password"
                  value={form.senha}
                  required
                  minLength={6}
                  onChange={e => setForm(f => ({ ...f, senha: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Consultor <span className="text-muted-foreground/50 font-normal normal-case">(opcional)</span>
                </label>
                <select
                  className="mt-1.5 w-full px-3 py-2.5 rounded-lg border border-border bg-muted/40 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/40"
                  value={form.consultor_id}
                  onChange={e => setForm(f => ({ ...f, consultor_id: e.target.value }))}
                >
                  <option value="">Sem consultor vinculado</option>
                  {consultores.map(c => (
                    <option key={c.id} value={c.id}>{c.nome}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={fecharModal}
                  className="flex-1 py-2.5 rounded-lg border border-border text-sm font-semibold text-muted-foreground hover:bg-accent transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="flex-1 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  {salvando ? "Salvando..." : "Cadastrar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
