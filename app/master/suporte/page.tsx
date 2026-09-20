"use client";

import { useEffect, useState } from "react";
import { MessageCircleQuestion, CheckCircle2, Clock, XCircle, Send, ChevronDown, ChevronUp, Filter } from "lucide-react";

interface Ticket {
  id: string;
  associacao_id: string | null;
  perfil_tipo: string;
  perfil_nome: string;
  assunto: string;
  mensagem: string;
  status: "aberto" | "respondido" | "fechado";
  resposta: string | null;
  respondido_em: string | null;
  created_at: string;
}

const statusInfo = {
  aberto:     { label: "Aberto",     color: "text-amber-500",   bg: "bg-amber-500/10",   icon: Clock },
  respondido: { label: "Respondido", color: "text-emerald-500", bg: "bg-emerald-500/10", icon: CheckCircle2 },
  fechado:    { label: "Fechado",    color: "text-slate-400",   bg: "bg-slate-500/10",   icon: XCircle },
};

const perfilBadge: Record<string, string> = {
  associacao: "bg-violet-500/10 text-violet-400",
  gestor:     "bg-cyan-500/10 text-cyan-400",
  consultor:  "bg-emerald-500/10 text-emerald-400",
  indicador:  "bg-amber-500/10 text-amber-400",
};

function fmt(dt: string) {
  return new Date(dt).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function MasterSuportePage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("todos");
  const [aberto, setAberto] = useState<string | null>(null);
  const [resposta, setResposta] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  const carregar = (f = filtro) => {
    setLoading(true);
    fetch(`/api/master/suporte?status=${f}`)
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((d: Ticket[]) => setTickets(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { carregar(); }, []);

  const trocarFiltro = (f: string) => { setFiltro(f); carregar(f); };

  const responder = async (id: string) => {
    if (!resposta.trim()) { setErro("Digite uma resposta."); return; }
    setEnviando(true); setErro("");
    try {
      const res = await fetch("/api/master/suporte", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, resposta: resposta.trim() }),
      });
      if (!res.ok) { const d = await res.json(); setErro(d.error ?? "Erro."); return; }
      setResposta(""); setAberto(null); carregar();
    } catch { setErro("Erro de conexão."); }
    finally { setEnviando(false); }
  };

  const fecharTicket = async (id: string) => {
    await fetch("/api/master/suporte", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "fechado" }),
    });
    carregar();
  };

  const abertos = tickets.filter((t) => t.status === "aberto").length;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
          <MessageCircleQuestion className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Suporte</h1>
          <p className="text-sm text-muted-foreground">Tickets de todos os painéis</p>
        </div>
        {abertos > 0 && (
          <span className="ml-auto text-xs font-bold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-500">
            {abertos} aberto{abertos > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        {["todos", "aberto", "respondido", "fechado"].map((f) => (
          <button
            key={f}
            onClick={() => trocarFiltro(f)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filtro === f
                ? "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            <Filter className="w-3 h-3" />
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Lista */}
      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : tickets.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum ticket encontrado.</p>
      ) : (
        <div className="space-y-3">
          {tickets.map((t) => {
            const info = statusInfo[t.status];
            const Icon = info.icon;
            const exp = aberto === t.id;
            return (
              <div key={t.id} className="rounded-2xl border border-border bg-card overflow-hidden">
                <button
                  className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/30 transition-colors"
                  onClick={() => { setAberto(exp ? null : t.id); setResposta(""); setErro(""); }}
                >
                  <Icon className={`w-4 h-4 flex-shrink-0 ${info.color}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${perfilBadge[t.perfil_tipo] ?? "bg-muted text-muted-foreground"}`}>
                        {t.perfil_tipo.toUpperCase()}
                      </span>
                      <span className="text-xs text-muted-foreground font-medium truncate">{t.perfil_nome}</span>
                    </div>
                    <p className="text-sm font-semibold text-foreground truncate">{t.assunto}</p>
                    <p className="text-xs text-muted-foreground">{fmt(t.created_at)}</p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${info.bg} ${info.color}`}>{info.label}</span>
                  {exp ? <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
                </button>

                {exp && (
                  <div className="px-4 pb-4 space-y-4 border-t border-border pt-4">
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">Mensagem</p>
                      <p className="text-sm text-foreground whitespace-pre-wrap">{t.mensagem}</p>
                    </div>

                    {t.resposta && (
                      <div className="rounded-xl bg-emerald-500/8 border border-emerald-500/20 p-3">
                        <p className="text-xs font-bold text-emerald-500 uppercase tracking-wide mb-1">Resposta enviada</p>
                        <p className="text-sm text-foreground whitespace-pre-wrap">{t.resposta}</p>
                        {t.respondido_em && <p className="text-xs text-muted-foreground mt-1">{fmt(t.respondido_em)}</p>}
                      </div>
                    )}

                    {t.status !== "fechado" && (
                      <div className="space-y-2">
                        <textarea
                          value={resposta}
                          onChange={(e) => setResposta(e.target.value)}
                          placeholder="Digite sua resposta para o usuário..."
                          rows={3}
                          className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:border-ring resize-none"
                        />
                        {erro && <p className="text-xs text-red-500">{erro}</p>}
                        <div className="flex gap-2">
                          <button
                            onClick={() => responder(t.id)}
                            disabled={enviando}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white bg-blue-500 hover:bg-blue-600 disabled:opacity-50 transition-colors"
                          >
                            <Send className="w-3.5 h-3.5" />
                            {t.resposta ? "Atualizar resposta" : "Responder"}
                          </button>
                          <button
                            onClick={() => fecharTicket(t.id)}
                            className="px-4 py-2 rounded-xl text-sm font-bold text-muted-foreground bg-muted hover:bg-muted/80 transition-colors"
                          >
                            Fechar ticket
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
