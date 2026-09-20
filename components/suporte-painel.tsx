"use client";

import { useEffect, useState } from "react";
import { MessageCircleQuestion, Send, CheckCircle2, Clock, XCircle, ChevronDown, ChevronUp } from "lucide-react";

interface Ticket {
  id: string;
  assunto: string;
  mensagem: string;
  status: "aberto" | "respondido" | "fechado";
  resposta: string | null;
  respondido_em: string | null;
  created_at: string;
}

interface Props {
  apiBase: string; // ex: "/api/consultor/suporte"
  accentColor: string;
  badgeLabel: string;
}

const statusInfo = {
  aberto:     { label: "Aberto",     color: "text-amber-500",   icon: Clock },
  respondido: { label: "Respondido", color: "text-emerald-500", icon: CheckCircle2 },
  fechado:    { label: "Fechado",    color: "text-slate-400",   icon: XCircle },
};

function fmt(dt: string) {
  return new Date(dt).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function SuportePainel({ apiBase, accentColor, badgeLabel }: Props) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [assunto, setAssunto] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState(false);
  const [aberto, setAberto] = useState<string | null>(null);

  const carregar = () => {
    setLoading(true);
    fetch(apiBase)
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((d: Ticket[]) => setTickets(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { carregar(); }, []);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assunto.trim() || !mensagem.trim()) { setErro("Preencha o assunto e a mensagem."); return; }
    setEnviando(true); setErro(""); setSucesso(false);
    try {
      const res = await fetch(apiBase, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assunto: assunto.trim(), mensagem: mensagem.trim() }),
      });
      if (!res.ok) { const d = await res.json(); setErro(d.error ?? "Erro ao enviar."); return; }
      setSucesso(true); setAssunto(""); setMensagem("");
      carregar();
      setTimeout(() => setSucesso(false), 3000);
    } catch { setErro("Erro de conexão."); }
    finally { setEnviando(false); }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-8">
      {/* Cabeçalho */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${accentColor}18` }}>
          <MessageCircleQuestion className="w-5 h-5" style={{ color: accentColor }} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Suporte</h1>
          <p className="text-sm text-muted-foreground">Envie suas dúvidas, problemas ou sugestões ao master.</p>
        </div>
        <span className="ml-auto text-xs font-bold px-2 py-1 rounded-full border" style={{ color: accentColor, borderColor: `${accentColor}40` }}>{badgeLabel}</span>
      </div>

      {/* Formulário novo ticket */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-sm font-bold text-foreground mb-4 uppercase tracking-wide">Abrir novo ticket</h2>
        <form onSubmit={enviar} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">Assunto</label>
            <input
              value={assunto}
              onChange={(e) => setAssunto(e.target.value)}
              placeholder="Ex: Problema no cadastro de fulano"
              maxLength={200}
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:border-ring"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">Mensagem</label>
            <textarea
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              placeholder="Descreva o problema ou sugestão em detalhes..."
              rows={4}
              maxLength={2000}
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:border-ring resize-none"
            />
            <p className="text-xs text-muted-foreground text-right mt-1">{mensagem.length}/2000</p>
          </div>
          {erro && <p className="text-xs text-red-500 bg-red-500/10 rounded-lg px-3 py-2">{erro}</p>}
          {sucesso && <p className="text-xs text-emerald-500 bg-emerald-500/10 rounded-lg px-3 py-2">Ticket enviado com sucesso!</p>}
          <button
            type="submit"
            disabled={enviando}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-opacity disabled:opacity-50"
            style={{ background: accentColor }}
          >
            <Send className="w-4 h-4" />
            {enviando ? "Enviando..." : "Enviar ticket"}
          </button>
        </form>
      </div>

      {/* Lista de tickets */}
      <div>
        <h2 className="text-sm font-bold text-foreground mb-4 uppercase tracking-wide">Meus tickets</h2>
        {loading ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : tickets.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum ticket aberto ainda.</p>
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
                    onClick={() => setAberto(exp ? null : t.id)}
                  >
                    <Icon className={`w-4 h-4 flex-shrink-0 ${info.color}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{t.assunto}</p>
                      <p className="text-xs text-muted-foreground">{fmt(t.created_at)}</p>
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-muted ${info.color}`}>{info.label}</span>
                    {exp ? <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
                  </button>

                  {exp && (
                    <div className="px-4 pb-4 space-y-3 border-t border-border pt-4">
                      <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">Sua mensagem</p>
                        <p className="text-sm text-foreground whitespace-pre-wrap">{t.mensagem}</p>
                      </div>
                      {t.resposta && (
                        <div className="rounded-xl bg-emerald-500/8 border border-emerald-500/20 p-3">
                          <p className="text-xs font-bold text-emerald-500 uppercase tracking-wide mb-1">Resposta do master</p>
                          <p className="text-sm text-foreground whitespace-pre-wrap">{t.resposta}</p>
                          {t.respondido_em && <p className="text-xs text-muted-foreground mt-1">{fmt(t.respondido_em)}</p>}
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
    </div>
  );
}
