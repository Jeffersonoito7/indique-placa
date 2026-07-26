"use client";

import { useEffect, useState, useCallback } from "react";
import { Megaphone, Plus, Pause, Play, Trash2, TrendingUp, TrendingDown, AlertCircle, CheckCircle2, Info, RefreshCw, Zap, Target, Eye, MousePointerClick, DollarSign, Users, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Papel = "gestor" | "consultor" | "associacao";

type Conta = {
  id: string; meta_ad_account_id: string; meta_page_id: string; nome_conta: string; ativo: boolean;
} | null;

type Campanha = {
  id: string; nome: string; status: string; orcamento_diario: number; copy_titulo: string | null; criado_em: string; meta_campaign_id: string | null;
};

type Alerta = {
  id: string; tipo: "positivo" | "negativo" | "info"; titulo: string; mensagem: string;
  acao_tomada: string | null; lido: boolean; criado_em: string; trafego_campanhas?: { nome: string } | null;
};

type CopyVariacao = {
  titulo: string; corpo: string; cta: string; justificativa: string;
};

function fmt(n: number, prefix = "") { return `${prefix}${n.toLocaleString("pt-BR")}`; }
function fmtBrl(n: number) { return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }
function fmtDate(s: string) { return new Date(s).toLocaleDateString("pt-BR"); }

const STATUS_LABEL: Record<string, string> = { ativa: "Ativa", pausada: "Pausada", rascunho: "Rascunho", encerrada: "Encerrada", erro: "Erro" };
const STATUS_COLOR: Record<string, string> = {
  ativa: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  pausada: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  rascunho: "bg-muted text-muted-foreground border-border",
  encerrada: "bg-muted text-muted-foreground border-border",
  erro: "bg-red-500/10 text-red-400 border-red-500/20",
};

const CTA_OPCOES = [
  { value: "LEARN_MORE", label: "Saiba mais" },
  { value: "CONTACT_US", label: "Fale conosco" },
  { value: "GET_QUOTE", label: "Simular agora" },
  { value: "SIGN_UP", label: "Cadastre-se" },
  { value: "SUBSCRIBE", label: "Quero proteger meu veículo" },
];

const VEICULO_OPCOES = ["carro", "moto", "caminhao", "todos"];

const FORM_VAZIO = {
  nome: "", orcamento_diario: 20, copy_titulo: "", copy_corpo: "", copy_cta: "LEARN_MORE",
  imagem_url: "", publico_localizacao: "", publico_idade_min: 25, publico_idade_max: 55,
};

export default function TrafegoPainel({ papel }: { papel: Papel }) {
  const base = `/api/${papel}/trafego`;

  const [conta, setConta] = useState<Conta>(undefined as unknown as Conta);
  const [campanhas, setCampanhas] = useState<Campanha[]>([]);
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [aba, setAba] = useState<"campanhas" | "alertas" | "conta">("campanhas");

  // Formulário nova campanha
  const [mostraForm, setMostraForm] = useState(false);
  const [form, setForm] = useState(FORM_VAZIO);
  const [submetendo, setSubmetendo] = useState(false);
  const [erroForm, setErroForm] = useState("");

  // Agente copy
  const [gerandoCopy, setGerandoCopy] = useState(false);
  const [variacoes, setVariacoes] = useState<CopyVariacao[]>([]);
  const [tipoVeiculo, setTipoVeiculo] = useState("carro");
  const [diferencial, setDiferencial] = useState("");

  // Formulário conta
  const [formConta, setFormConta] = useState({ meta_access_token: "", meta_ad_account_id: "", meta_page_id: "", meta_instagram_actor_id: "", openai_api_key: "" });
  const [salvandoConta, setSalvandoConta] = useState(false);
  const [erroConta, setErroConta] = useState("");
  const [sucessoConta, setSucessoConta] = useState("");

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const [resConta, resCamp, resAl] = await Promise.all([
        fetch(`${base}/conta`).then(r => r.json()),
        fetch(`${base}/campanhas`).then(r => r.json()),
        fetch(`${base}/alertas`).then(r => r.json()),
      ]);
      setConta(resConta.conta ?? null);
      setCampanhas(resCamp.campanhas ?? []);
      setAlertas(resAl.alertas ?? []);
    } finally { setCarregando(false); }
  }, [base]);

  useEffect(() => { void carregar(); }, [carregar]);

  const salvarConta = async (e: React.FormEvent) => {
    e.preventDefault(); setErroConta(""); setSucessoConta(""); setSalvandoConta(true);
    try {
      const r = await fetch(`${base}/conta`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(formConta) });
      const json = await r.json();
      if (!r.ok) { setErroConta(json.error ?? "Erro"); return; }
      setSucessoConta(`Conta conectada: ${json.nome}`);
      void carregar();
    } finally { setSalvandoConta(false); }
  };

  const desconectarConta = async () => {
    if (!confirm("Desconectar conta Meta? As campanhas existentes serão mantidas.")) return;
    await fetch(`${base}/conta`, { method: "DELETE" });
    void carregar();
  };

  const gerarCopy = async () => {
    setGerandoCopy(true); setVariacoes([]);
    try {
      const r = await fetch(`${base}/agente`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tipo_veiculo: tipoVeiculo, diferencial }) });
      const json = await r.json();
      if (r.ok) setVariacoes(json.variacoes ?? []);
    } finally { setGerandoCopy(false); }
  };

  const usarVariacao = (v: CopyVariacao) => {
    setForm(f => ({ ...f, copy_titulo: v.titulo.slice(0, 125), copy_corpo: v.corpo, copy_cta: v.cta }));
    setVariacoes([]);
  };

  const criarCampanha = async (e: React.FormEvent) => {
    e.preventDefault(); setErroForm(""); setSubmetendo(true);
    try {
      const r = await fetch(`${base}/campanhas`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, orcamento_diario: Number(form.orcamento_diario), publico_idade_min: Number(form.publico_idade_min), publico_idade_max: Number(form.publico_idade_max) }) });
      const json = await r.json();
      if (!r.ok) { setErroForm(json.error ?? "Erro"); return; }
      setMostraForm(false);
      setForm(FORM_VAZIO);
      void carregar();
    } finally { setSubmetendo(false); }
  };

  const alterarStatus = async (id: string, status: "ativa" | "pausada") => {
    await fetch(`${base}/campanhas/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    void carregar();
  };

  const encerrar = async (id: string) => {
    if (!confirm("Encerrar campanha?")) return;
    await fetch(`${base}/campanhas/${id}`, { method: "DELETE" });
    void carregar();
  };

  const marcarAlertasLidos = async () => {
    await fetch(`${base}/alertas`, { method: "PATCH" });
    setAlertas(al => al.map(a => ({ ...a, lido: true })));
  };

  const alertasNaoLidos = alertas.filter(a => !a.lido).length;

  if (carregando) return <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">Carregando...</div>;

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Header */}
      <div className="px-8 py-5 border-b border-border flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-foreground flex items-center gap-2">
            <Megaphone className="h-4 w-4 text-violet-400" /> Gestor de Tráfego Pago
          </h1>
          <p className="text-[11px] text-muted-foreground mt-0.5">Campanhas no Instagram com automação por IA</p>
        </div>
        <div className="flex items-center gap-2">
          {conta && (
            <button onClick={() => { setMostraForm(true); setVariacoes([]); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500 hover:bg-violet-600 text-white text-xs font-semibold transition-colors">
              <Plus className="h-3.5 w-3.5" /> Nova Campanha
            </button>
          )}
          <button onClick={() => void carregar()} className="p-1.5 rounded-lg border border-border hover:bg-accent transition-colors">
            <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Abas */}
      <div className="px-8 border-b border-border flex gap-4">
        {(["campanhas", "alertas", "conta"] as const).map(a => (
          <button key={a} onClick={() => setAba(a)}
            className={cn("py-3 text-xs font-semibold border-b-2 transition-colors capitalize relative",
              aba === a ? "border-violet-500 text-violet-400" : "border-transparent text-muted-foreground hover:text-foreground")}>
            {a === "alertas" ? "Alertas" : a === "conta" ? "Conta Meta" : "Campanhas"}
            {a === "alertas" && alertasNaoLidos > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[9px] font-bold">{alertasNaoLidos}</span>
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-8 bg-muted/30">

        {/* Modal nova campanha */}
        {mostraForm && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                <h2 className="text-sm font-bold">Nova Campanha Instagram</h2>
                <button onClick={() => setMostraForm(false)} className="p-1 hover:bg-accent rounded-lg"><X className="h-4 w-4" /></button>
              </div>
              <div className="p-6 space-y-5">
                {/* Agente copy */}
                <div className="p-4 rounded-xl border border-violet-500/20 bg-violet-500/5 space-y-3">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-violet-400" />
                    <span className="text-xs font-bold text-violet-400">Agente IA — Gerar Copy</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-muted-foreground mb-1 block">Tipo de veículo</label>
                      <select className="w-full text-xs bg-background border border-border rounded-lg px-2 py-1.5" value={tipoVeiculo} onChange={e => setTipoVeiculo(e.target.value)}>
                        {VEICULO_OPCOES.map(v => <option key={v} value={v}>{v.charAt(0).toUpperCase() + v.slice(1)}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground mb-1 block">Diferencial (opcional)</label>
                      <input className="w-full text-xs bg-background border border-border rounded-lg px-2 py-1.5" placeholder="Ex: Preço justo, 24h..." value={diferencial} onChange={e => setDiferencial(e.target.value)} />
                    </div>
                  </div>
                  <button onClick={() => void gerarCopy()} disabled={gerandoCopy}
                    className="w-full py-2 rounded-lg bg-violet-500 hover:bg-violet-600 text-white text-xs font-bold transition-colors disabled:opacity-50">
                    {gerandoCopy ? "Gerando variações..." : "Gerar 3 variações de copy"}
                  </button>
                  {variacoes.length > 0 && (
                    <div className="space-y-2 mt-2">
                      {variacoes.map((v, i) => (
                        <div key={i} className="p-3 rounded-lg border border-border bg-background cursor-pointer hover:border-violet-500/40 transition-colors" onClick={() => usarVariacao(v)}>
                          <p className="text-xs font-bold text-foreground">{v.titulo}</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{v.corpo}</p>
                          <p className="text-[10px] text-violet-400 mt-1">CTA: {v.cta} — {v.justificativa}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <form onSubmit={e => void criarCampanha(e)} className="space-y-4">
                  {erroForm && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400">{erroForm}</div>}

                  <div>
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Nome da campanha</label>
                    <input required className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2" placeholder="Ex: Proteção Veicular SP - Julho" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Orçamento diário (R$)</label>
                      <input type="number" required min={5} className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2" value={form.orcamento_diario} onChange={e => setForm(f => ({ ...f, orcamento_diario: Number(e.target.value) }))} />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Localização (opcional)</label>
                      <input className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2" placeholder="Ex: São Paulo, SP" value={form.publico_localizacao} onChange={e => setForm(f => ({ ...f, publico_localizacao: e.target.value }))} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Idade mínima</label>
                      <input type="number" min={18} max={65} className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2" value={form.publico_idade_min} onChange={e => setForm(f => ({ ...f, publico_idade_min: Number(e.target.value) }))} />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Idade máxima</label>
                      <input type="number" min={18} max={65} className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2" value={form.publico_idade_max} onChange={e => setForm(f => ({ ...f, publico_idade_max: Number(e.target.value) }))} />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Título do anúncio (máx 125 chars)</label>
                    <input required maxLength={125} className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2" placeholder="Proteja seu veículo por muito menos" value={form.copy_titulo} onChange={e => setForm(f => ({ ...f, copy_titulo: e.target.value }))} />
                    <p className="text-[10px] text-muted-foreground mt-0.5">{form.copy_titulo.length}/125</p>
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Texto do anúncio</label>
                    <textarea required rows={3} className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 resize-none" placeholder="Cansado de pagar caro no seguro? A proteção veicular oferece cobertura real com custo muito menor." value={form.copy_corpo} onChange={e => setForm(f => ({ ...f, copy_corpo: e.target.value }))} />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Call to Action</label>
                      <select className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2" value={form.copy_cta} onChange={e => setForm(f => ({ ...f, copy_cta: e.target.value }))}>
                        {CTA_OPCOES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">URL da imagem (opcional)</label>
                      <input type="url" className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2" placeholder="https://..." value={form.imagem_url} onChange={e => setForm(f => ({ ...f, imagem_url: e.target.value }))} />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button type="button" onClick={() => setMostraForm(false)} className="flex-1 py-2 rounded-lg border border-border text-xs font-semibold hover:bg-accent transition-colors">Cancelar</button>
                    <button type="submit" disabled={submetendo} className="flex-2 px-6 py-2 rounded-lg bg-violet-500 hover:bg-violet-600 text-white text-xs font-bold transition-colors disabled:opacity-50">
                      {submetendo ? "Publicando..." : "Publicar campanha"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Aba Campanhas */}
        {aba === "campanhas" && (
          <div className="space-y-4">
            {!conta && (
              <Card className="border-amber-500/20 bg-amber-500/5">
                <CardContent className="p-5 flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-400 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">Conta Meta nao conectada</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Vá em <button onClick={() => setAba("conta")} className="text-violet-400 underline">Conta Meta</button> para conectar sua conta de anúncios.</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {campanhas.length === 0 ? (
              <Card>
                <CardContent className="p-10 flex flex-col items-center gap-3">
                  <Megaphone className="h-10 w-10 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">Nenhuma campanha criada ainda.</p>
                  {conta && (
                    <button onClick={() => setMostraForm(true)} className="mt-1 px-4 py-2 rounded-lg bg-violet-500 hover:bg-violet-600 text-white text-xs font-bold transition-colors">
                      Criar primeira campanha
                    </button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {campanhas.map(c => (
                  <Card key={c.id} className="shadow-sm">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-foreground">{c.nome}</span>
                            <span className={cn("text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border font-semibold", STATUS_COLOR[c.status] ?? STATUS_COLOR.rascunho)}>
                              {STATUS_LABEL[c.status] ?? c.status}
                            </span>
                          </div>
                          {c.copy_titulo && <p className="text-xs text-muted-foreground mt-1 truncate">{c.copy_titulo}</p>}
                          <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                            <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" /> {fmtBrl(c.orcamento_diario)}/dia</span>
                            <span>Criada {fmtDate(c.criado_em)}</span>
                            {!c.meta_campaign_id && <span className="text-amber-400">Sem ID Meta</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {c.status === "ativa" && (
                            <button onClick={() => void alterarStatus(c.id, "pausada")}
                              className="p-1.5 rounded-lg border border-border hover:bg-amber-500/10 hover:border-amber-500/30 transition-colors" title="Pausar">
                              <Pause className="h-3.5 w-3.5 text-amber-400" />
                            </button>
                          )}
                          {c.status === "pausada" && (
                            <button onClick={() => void alterarStatus(c.id, "ativa")}
                              className="p-1.5 rounded-lg border border-border hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-colors" title="Reativar">
                              <Play className="h-3.5 w-3.5 text-emerald-400" />
                            </button>
                          )}
                          {(c.status === "ativa" || c.status === "pausada" || c.status === "erro") && (
                            <button onClick={() => void encerrar(c.id)}
                              className="p-1.5 rounded-lg border border-border hover:bg-red-500/10 hover:border-red-500/30 transition-colors" title="Encerrar">
                              <Trash2 className="h-3.5 w-3.5 text-red-400" />
                            </button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Aba Alertas */}
        {aba === "alertas" && (
          <div className="space-y-4">
            {alertas.length > 0 && alertasNaoLidos > 0 && (
              <div className="flex justify-end">
                <button onClick={() => void marcarAlertasLidos()} className="text-xs text-muted-foreground hover:text-foreground underline">Marcar todos como lidos</button>
              </div>
            )}
            {alertas.length === 0 ? (
              <Card>
                <CardContent className="p-10 flex flex-col items-center gap-2">
                  <CheckCircle2 className="h-8 w-8 text-emerald-400/40" />
                  <p className="text-sm text-muted-foreground">Nenhum alerta ainda. Os alertas aparecem automaticamente conforme as campanhas rodam.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {alertas.map(a => (
                  <div key={a.id} className={cn(
                    "flex gap-3 p-4 rounded-xl border transition-colors",
                    !a.lido ? "bg-card" : "bg-muted/20 opacity-70",
                    a.tipo === "positivo" ? "border-emerald-500/20" : a.tipo === "negativo" ? "border-red-500/20" : "border-border"
                  )}>
                    <div className="shrink-0 mt-0.5">
                      {a.tipo === "positivo" ? <TrendingUp className="h-4 w-4 text-emerald-400" /> :
                       a.tipo === "negativo" ? <TrendingDown className="h-4 w-4 text-red-400" /> :
                       <Info className="h-4 w-4 text-blue-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-foreground">{a.titulo}</span>
                        {!a.lido && <span className="w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0" />}
                      </div>
                      {a.trafego_campanhas?.nome && (
                        <p className="text-[10px] text-violet-400 mt-0.5">{a.trafego_campanhas.nome}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">{a.mensagem}</p>
                      {a.acao_tomada && (
                        <p className="text-[10px] text-muted-foreground/60 mt-1 italic">{a.acao_tomada}</p>
                      )}
                      <p className="text-[10px] text-muted-foreground/40 mt-1">{fmtDate(a.criado_em)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Aba Conta Meta */}
        {aba === "conta" && (
          <div className="max-w-lg space-y-5">
            {conta ? (
              <Card className="border-emerald-500/20 bg-emerald-500/5">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-foreground flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Conta conectada
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">{conta.nome_conta} — {conta.meta_ad_account_id}</p>
                    </div>
                    <button onClick={() => void desconectarConta()} className="text-xs text-red-400 hover:text-red-300 underline">Desconectar</button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-amber-500/20 bg-amber-500/5">
                <CardContent className="p-5">
                  <p className="text-sm font-semibold text-amber-400 mb-1">Conta Meta nao conectada</p>
                  <p className="text-xs text-muted-foreground">Conecte sua conta de anúncios do Meta para criar campanhas no Instagram.</p>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader className="pb-3 border-b border-border">
                <CardTitle className="text-sm font-semibold">{conta ? "Atualizar credenciais" : "Conectar conta Meta"}</CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                <form onSubmit={e => void salvarConta(e)} className="space-y-3">
                  {erroConta && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400">{erroConta}</div>}
                  {sucessoConta && <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400">{sucessoConta}</div>}

                  <div>
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Access Token (Meta)</label>
                    <input required type="password" className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 font-mono" placeholder="EAAxxxxxx..." value={formConta.meta_access_token} onChange={e => setFormConta(f => ({ ...f, meta_access_token: e.target.value }))} />
                    <p className="text-[10px] text-muted-foreground mt-1">Token de acesso de longa duração do Meta Business. Gerado em business.facebook.com</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">ID da conta de anúncios</label>
                    <input required className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 font-mono" placeholder="act_123456789" value={formConta.meta_ad_account_id} onChange={e => setFormConta(f => ({ ...f, meta_ad_account_id: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">ID da Página do Facebook</label>
                    <input required className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 font-mono" placeholder="123456789" value={formConta.meta_page_id} onChange={e => setFormConta(f => ({ ...f, meta_page_id: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">ID do Instagram (opcional)</label>
                    <input className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 font-mono" placeholder="17841400000000000" value={formConta.meta_instagram_actor_id} onChange={e => setFormConta(f => ({ ...f, meta_instagram_actor_id: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Chave OpenAI (para agente de copy)</label>
                    <input type="password" className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 font-mono" placeholder="sk-..." value={formConta.openai_api_key} onChange={e => setFormConta(f => ({ ...f, openai_api_key: e.target.value }))} />
                    <p className="text-[10px] text-muted-foreground mt-1">Sua chave pessoal em platform.openai.com. Opcional — sem ela o agente de copy fica indisponivel.</p>
                  </div>

                  <button type="submit" disabled={salvandoConta} className="w-full py-2.5 rounded-lg bg-violet-500 hover:bg-violet-600 text-white text-sm font-bold transition-colors disabled:opacity-50">
                    {salvandoConta ? "Validando e conectando..." : "Conectar conta"}
                  </button>
                </form>

                <div className="mt-4 p-3 rounded-lg bg-muted/40 border border-border">
                  <p className="text-[10px] font-semibold text-muted-foreground mb-1">Como obter as credenciais:</p>
                  <ol className="text-[10px] text-muted-foreground space-y-1 list-decimal list-inside">
                    <li>Acesse business.facebook.com</li>
                    <li>Vá em Configuracoes de Negocio &gt; Tokens de Acesso do Sistema</li>
                    <li>Crie um token com permissoes: ads_management, ads_read</li>
                    <li>O ID da conta fica em Gerenciador de Anuncios (formato act_XXXXXXX)</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
