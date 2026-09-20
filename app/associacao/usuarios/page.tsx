"use client";

import { useEffect, useState } from "react";
import { Users, Pencil, KeyRound, X, Check, AlertCircle, ChevronDown, Briefcase, UserCheck, Zap } from "lucide-react";

interface Gestor {
  id: string; nome: string; email: string; fone: string | null; ativo: boolean; criado_em: string;
}
interface Consultor {
  id: string; nome: string; email: string; fone: string | null; status: string; plano: string; gestor_id: string | null; created_at: string;
}
interface Indicador {
  id: string; nome: string; telefone: string; consultor_id: string | null; criado_em: string;
}

type Aba = "gestores" | "consultores" | "indicadores";

function fmt(dt: string) {
  return new Date(dt).toLocaleDateString("pt-BR");
}

function gerarSenha() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#";
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

interface ModalEdicaoProps {
  tipo: Aba;
  item: Gestor | Consultor | Indicador;
  onClose: () => void;
  onSalvo: () => void;
}

function ModalEdicao({ tipo, item, onClose, onSalvo }: ModalEdicaoProps) {
  const [nome, setNome] = useState(item.nome);
  const [email, setEmail] = useState((item as Consultor).email ?? "");
  const [fone, setFone] = useState((item as Gestor).fone ?? (item as Consultor).fone ?? (item as Indicador).telefone ?? "");
  const [status, setStatus] = useState((item as Consultor).status ?? "ativo");
  const [plano, setPlano] = useState((item as Consultor).plano ?? "gratis");
  const [planoAte, setPlanoAte] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [senhaGerada, setSenhaGerada] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const apiUrl = `/api/associacao/${tipo}/${item.id}`;

  const gerarESalvarSenha = () => {
    const s = gerarSenha();
    setNovaSenha(s);
    setSenhaGerada(s);
  };

  const salvar = async () => {
    setSalvando(true); setErro(""); setSucesso("");
    const body: Record<string, unknown> = { nome };

    if (tipo === "gestores") body.fone = fone;
    if (tipo === "consultores") { body.email = email; body.fone = fone; body.status = status; body.plano = plano; if (planoAte) body.plano_ativo_ate = planoAte; }
    if (tipo === "indicadores") body.telefone = fone;
    if (novaSenha) body.nova_senha = novaSenha;

    try {
      const res = await fetch(apiUrl, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) { const d = await res.json(); setErro(d.error ?? "Erro ao salvar."); return; }
      setSucesso("Salvo com sucesso!");
      setTimeout(() => { onSalvo(); onClose(); }, 1000);
    } catch { setErro("Erro de conexão."); }
    finally { setSalvando(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-base font-bold text-foreground">Editar {tipo.slice(0, -1)}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>

        <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Nome */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">Nome</label>
            <input value={nome} onChange={(e) => setNome(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:border-ring" />
          </div>

          {/* Email (gestor e consultor) */}
          {(tipo === "gestores" || tipo === "consultores") && (
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">E-mail</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:border-ring" />
            </div>
          )}

          {/* Fone / Telefone */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">{tipo === "indicadores" ? "Telefone" : "Fone"}</label>
            <input value={fone} onChange={(e) => setFone(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:border-ring" />
          </div>

          {/* Status e Plano (só consultor) */}
          {tipo === "consultores" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">Status</label>
                  <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none">
                    <option value="ativo">Ativo</option>
                    <option value="inativo">Inativo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">Plano</label>
                  <select value={plano} onChange={(e) => setPlano(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none">
                    <option value="gratis">Grátis</option>
                    <option value="pro">Pro</option>
                  </select>
                </div>
              </div>
              {plano === "pro" && (
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">Plano ativo até</label>
                  <input type="date" value={planoAte} onChange={(e) => setPlanoAte(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:border-ring" />
                </div>
              )}
            </>
          )}

          {/* Redefinir senha */}
          <div className="border-t border-border pt-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Redefinir senha</p>
            <div className="flex gap-2">
              <input
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                placeholder="Nova senha (min. 6 caracteres)"
                className="flex-1 px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:border-ring"
              />
              <button
                type="button"
                onClick={gerarESalvarSenha}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-muted text-muted-foreground text-xs font-semibold hover:bg-muted/80 whitespace-nowrap"
              >
                <KeyRound className="w-3.5 h-3.5" />
                Gerar
              </button>
            </div>
            {senhaGerada && (
              <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                <p className="text-xs text-amber-500">Senha gerada: <strong className="font-mono">{senhaGerada}</strong> — anote antes de salvar.</p>
              </div>
            )}
          </div>

          {erro && <p className="text-xs text-red-500 bg-red-500/10 rounded-lg px-3 py-2">{erro}</p>}
          {sucesso && <p className="text-xs text-emerald-500 bg-emerald-500/10 rounded-lg px-3 py-2">{sucesso}</p>}
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-border">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-semibold text-muted-foreground bg-muted hover:bg-muted/80">Cancelar</button>
          <button onClick={salvar} disabled={salvando} className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-50">
            <Check className="w-4 h-4" />
            {salvando ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AssociacaoUsuariosPage() {
  const [aba, setAba] = useState<Aba>("gestores");
  const [gestores, setGestores] = useState<Gestor[]>([]);
  const [consultores, setConsultores] = useState<Consultor[]>([]);
  const [indicadores, setIndicadores] = useState<Indicador[]>([]);
  const [loading, setLoading] = useState(false);
  const [editando, setEditando] = useState<(Gestor | Consultor | Indicador) | null>(null);
  const [busca, setBusca] = useState("");

  const carregar = (a: Aba) => {
    setLoading(true);
    fetch(`/api/associacao/${a}`)
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((d) => {
        if (a === "gestores") setGestores(d);
        if (a === "consultores") setConsultores(d);
        if (a === "indicadores") setIndicadores(d);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { carregar(aba); }, [aba]);

  const abas: { key: Aba; label: string; icon: React.ElementType; count: number }[] = [
    { key: "gestores",    label: "Gestores",    icon: Briefcase,  count: gestores.length },
    { key: "consultores", label: "Consultores", icon: Users,      count: consultores.length },
    { key: "indicadores", label: "Indicadores", icon: UserCheck,  count: indicadores.length },
  ];

  const listaFiltrada = () => {
    const q = busca.toLowerCase();
    if (aba === "gestores")    return gestores.filter((g) => g.nome.toLowerCase().includes(q) || g.email.toLowerCase().includes(q));
    if (aba === "consultores") return consultores.filter((c) => c.nome.toLowerCase().includes(q) || c.email.toLowerCase().includes(q));
    return indicadores.filter((i) => i.nome.toLowerCase().includes(q) || i.telefone.includes(q));
  };

  const renderLinha = (item: Gestor | Consultor | Indicador) => {
    const c = item as Consultor;
    const g = item as Gestor;
    return (
      <div key={item.id} className="flex items-center gap-3 p-4 hover:bg-muted/30 transition-colors border-b border-border last:border-0">
        <div className="w-8 h-8 rounded-full bg-violet-500/10 flex items-center justify-center text-violet-400 font-bold text-xs flex-shrink-0">
          {item.nome.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{item.nome}</p>
          <p className="text-xs text-muted-foreground">
            {aba === "indicadores" ? (item as Indicador).telefone : (c.email ?? g.email)}
          </p>
        </div>
        {aba === "consultores" && (
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${c.status === "ativo" ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"}`}>
              {c.status}
            </span>
            {c.plano === "pro" && (
              <span className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500">
                <Zap className="w-3 h-3" />PRO
              </span>
            )}
          </div>
        )}
        {aba === "gestores" && (
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${g.ativo ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"}`}>
            {g.ativo ? "ativo" : "inativo"}
          </span>
        )}
        <button
          onClick={() => setEditando(item)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 text-xs font-semibold transition-colors"
        >
          <Pencil className="w-3 h-3" />
          Editar
        </button>
      </div>
    );
  };

  const lista = listaFiltrada();

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
          <Users className="w-5 h-5 text-violet-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Gestão de Usuários</h1>
          <p className="text-sm text-muted-foreground">Edite dados, redefina senhas e altere planos dos seus usuários.</p>
        </div>
      </div>

      {/* Abas */}
      <div className="flex gap-2 border-b border-border pb-0">
        {abas.map((a) => {
          const Icon = a.icon;
          return (
            <button
              key={a.key}
              onClick={() => { setAba(a.key); setBusca(""); }}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px ${
                aba === a.key
                  ? "border-violet-500 text-violet-400"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-4 h-4" />
              {a.label}
              {a.count > 0 && (
                <span className="text-xs font-bold px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">{a.count}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Busca */}
      <input
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        placeholder={`Buscar ${aba}...`}
        className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:border-ring"
      />

      {/* Lista */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        {loading ? (
          <p className="text-sm text-muted-foreground p-6">Carregando...</p>
        ) : lista.length === 0 ? (
          <p className="text-sm text-muted-foreground p-6">Nenhum registro encontrado.</p>
        ) : (
          lista.map((item) => renderLinha(item as Gestor | Consultor | Indicador))
        )}
      </div>

      {/* Modal de edição */}
      {editando && (
        <ModalEdicao
          tipo={aba}
          item={editando}
          onClose={() => setEditando(null)}
          onSalvo={() => carregar(aba)}
        />
      )}
    </div>
  );
}
