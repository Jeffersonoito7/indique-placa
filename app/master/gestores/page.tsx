"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, Plus, X, Check, Pencil, UserX, UserCheck, KeyRound, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Gestor {
  id: string;
  nome: string;
  email: string;
  fone: string | null;
  ativo: boolean;
  plano: string;
  criado_em: string;
  associacao: string | null;
  associacao_id: string | null;
}

interface Associacao { id: string; nome: string }

function Badge({ ativo }: { ativo: boolean }) {
  return (
    <span className={cn("px-2 py-0.5 rounded-md text-xs font-semibold", ativo ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400")}>
      {ativo ? "Ativo" : "Inativo"}
    </span>
  );
}

function ModalCriar({ associacoes, onClose, onFeito }: { associacoes: Associacao[]; onClose: () => void; onFeito: () => void }) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [fone, setFone] = useState("");
  const [senha, setSenha] = useState("");
  const [plano, setPlano] = useState("free");
  const [associacao_id, setAssociacaoId] = useState("");
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  const salvar = async () => {
    setErro("");
    setSalvando(true);
    const res = await fetch("/api/master/gestores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, email, fone: fone || undefined, senha, plano, associacao_id: associacao_id || null }),
    });
    const json = await res.json();
    setSalvando(false);
    if (!res.ok) { setErro(json.error ?? "Erro ao criar"); return; }
    onFeito();
  };

  const campo = "w-full px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-slate-200 outline-none focus:border-blue-500/50 placeholder:text-slate-500";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,.7)", backdropFilter: "blur(4px)" }}>
      <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-slate-100">Novo Gestor</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300"><X size={18} /></button>
        </div>

        {erro && <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{erro}</div>}

        <div className="flex flex-col gap-3">
          <input className={campo} placeholder="Nome completo" value={nome} onChange={(e) => setNome(e.target.value)} />
          <input className={campo} placeholder="E-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="off" />
          <input className={campo} placeholder="WhatsApp (opcional)" value={fone} onChange={(e) => setFone(e.target.value)} />
          <input className={campo} placeholder="Senha inicial (min. 6 caracteres)" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} />
          <select className={campo} value={plano} onChange={(e) => setPlano(e.target.value)}>
            <option value="free">Free</option>
            <option value="pro">Pro</option>
          </select>
          {associacoes.length > 0 && (
            <select className={campo} value={associacao_id} onChange={(e) => setAssociacaoId(e.target.value)}>
              <option value="">Sem associação (nacional)</option>
              {associacoes.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
            </select>
          )}
        </div>

        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 py-2 rounded-lg border border-white/10 text-slate-400 text-sm hover:bg-white/5">Cancelar</button>
          <button onClick={salvar} disabled={salvando || !nome || !email || !senha} className="flex-1 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-500 disabled:opacity-50">
            {salvando ? "Criando..." : "Criar Gestor"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ModalEditar({ gestor, associacoes, onClose, onFeito }: { gestor: Gestor; associacoes: Associacao[]; onClose: () => void; onFeito: () => void }) {
  const [nome, setNome] = useState(gestor.nome);
  const [fone, setFone] = useState(gestor.fone ?? "");
  const [plano, setPlano] = useState(gestor.plano);
  const [associacao_id, setAssociacaoId] = useState(gestor.associacao_id ?? "");
  const [novaSenha, setNovaSenha] = useState("");
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  const salvar = async () => {
    setErro("");
    setSalvando(true);
    const body: Record<string, unknown> = { nome, fone: fone || null, plano, associacao_id: associacao_id || null };
    if (novaSenha) body.nova_senha = novaSenha;
    const res = await fetch(`/api/master/gestores/${gestor.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    setSalvando(false);
    if (!res.ok) { setErro(json.error ?? "Erro"); return; }
    onFeito();
  };

  const campo = "w-full px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-slate-200 outline-none focus:border-blue-500/50 placeholder:text-slate-500";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,.7)", backdropFilter: "blur(4px)" }}>
      <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-slate-100">Editar Gestor</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300"><X size={18} /></button>
        </div>

        {erro && <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{erro}</div>}

        <div className="flex flex-col gap-3">
          <input className={campo} placeholder="Nome" value={nome} onChange={(e) => setNome(e.target.value)} />
          <input className={campo} placeholder="WhatsApp" value={fone} onChange={(e) => setFone(e.target.value)} />
          <select className={campo} value={plano} onChange={(e) => setPlano(e.target.value)}>
            <option value="free">Free</option>
            <option value="pro">Pro</option>
          </select>
          {associacoes.length > 0 && (
            <select className={campo} value={associacao_id} onChange={(e) => setAssociacaoId(e.target.value)}>
              <option value="">Sem associação (nacional)</option>
              {associacoes.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
            </select>
          )}
          <div className="relative">
            <KeyRound size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input className={cn(campo, "pl-8")} placeholder="Nova senha (deixe em branco para manter)" type="password" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} />
          </div>
        </div>

        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 py-2 rounded-lg border border-white/10 text-slate-400 text-sm hover:bg-white/5">Cancelar</button>
          <button onClick={salvar} disabled={salvando} className="flex-1 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-500 disabled:opacity-50">
            {salvando ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MasterGestoresPage() {
  const [gestores, setGestores] = useState<Gestor[]>([]);
  const [associacoes, setAssociacoes] = useState<Associacao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [modalCriar, setModalCriar] = useState(false);
  const [editando, setEditando] = useState<Gestor | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    const [rG, rA] = await Promise.all([
      fetch("/api/master/gestores").then((r) => r.json()),
      fetch("/api/master/associacoes").then((r) => r.json()),
    ]);
    setGestores(Array.isArray(rG) ? rG : []);
    setAssociacoes(Array.isArray(rA) ? rA : []);
    setCarregando(false);
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const toggleAtivo = async (g: Gestor) => {
    await fetch(`/api/master/gestores/${g.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ativo: !g.ativo }),
    });
    carregar();
  };

  const deletar = async (id: string) => {
    await fetch(`/api/master/gestores/${id}`, { method: "DELETE" });
    setConfirmDelete(null);
    carregar();
  };

  const ativos = gestores.filter((g) => g.ativo).length;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px" }}>
      {modalCriar && <ModalCriar associacoes={associacoes} onClose={() => setModalCriar(false)} onFeito={() => { setModalCriar(false); carregar(); }} />}
      {editando && <ModalEditar gestor={editando} associacoes={associacoes} onClose={() => setEditando(null)} onFeito={() => { setEditando(null); carregar(); }} />}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,.7)", backdropFilter: "blur(4px)" }}>
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl">
            <Trash2 size={32} className="text-red-400 mx-auto mb-3" />
            <p className="text-slate-200 text-sm mb-5">Remover este gestor? Os consultores vinculados a ele ficam sem gestor.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2 rounded-lg border border-white/10 text-slate-400 text-sm">Cancelar</button>
              <button onClick={() => deletar(confirmDelete)} className="flex-1 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold">Remover</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <ShieldCheck size={20} className="text-blue-400" />
            Gestores
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">{gestores.length} cadastrados, {ativos} ativos</p>
        </div>
        <button onClick={() => setModalCriar(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-500">
          <Plus size={15} /> Novo Gestor
        </button>
      </div>

      {carregando ? (
        <div className="text-center py-12 text-slate-500 text-sm">Carregando...</div>
      ) : gestores.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-slate-500 text-sm">
            Nenhum gestor cadastrado. Clique em "Novo Gestor" para comecar.
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {gestores.map((g) => (
            <Card key={g.id} className={cn(!g.ativo && "opacity-60")}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-900 to-emerald-900 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                  {g.nome.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-100 text-sm">{g.nome}</span>
                    <Badge ativo={g.ativo} />
                    <span className={cn("px-2 py-0.5 rounded-md text-xs font-semibold", g.plano === "pro" ? "bg-violet-500/10 text-violet-400" : "bg-slate-500/10 text-slate-400")}>
                      {g.plano.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5 flex flex-wrap gap-x-3">
                    <span>{g.email}</span>
                    {g.fone && <span>{g.fone}</span>}
                    {g.associacao && <span className="text-blue-400">{g.associacao}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => setEditando(g)} title="Editar" className="p-2 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/5">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => toggleAtivo(g)} title={g.ativo ? "Desativar" : "Ativar"} className="p-2 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/5">
                    {g.ativo ? <UserX size={14} /> : <UserCheck size={14} />}
                  </button>
                  <button onClick={() => setConfirmDelete(g.id)} title="Remover" className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/5">
                    <Trash2 size={14} />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
