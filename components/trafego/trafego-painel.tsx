"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Megaphone, Plus, Pause, Play, Trash2, TrendingUp, TrendingDown, AlertCircle, CheckCircle2, Info, RefreshCw, Zap, Target, Eye, MousePointerClick, DollarSign, Users, X, Video, Upload, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Papel = "gestor" | "consultor" | "associacao" | "master";

type Conta = {
  id: string; meta_ad_account_id: string; meta_page_id: string; nome_conta: string; ativo: boolean;
} | null;

type InsightCard = { gasto: number; leads: number; cpl: number; ctr: number; impressoes: number };

type Campanha = {
  id: string; nome: string; status: string; orcamento_diario: number; copy_titulo: string | null; criado_em: string; meta_campaign_id: string | null;
  insights?: InsightCard | null;
};

type Alerta = {
  id: string; tipo: "positivo" | "negativo" | "info"; titulo: string; mensagem: string;
  acao_tomada: string | null; lido: boolean; criado_em: string; trafego_campanhas?: { nome: string } | null;
};

type CopyVariacao = {
  titulo: string; corpo: string; cta: string; justificativa: string;
};

type VideoStatus = "idle" | "uploading" | "processando" | "pronto" | "erro";

type GuiaStep = {
  n: string;
  titulo: string;
  desc: string;
  dica?: string;
  link?: string;
  linkLabel?: string;
  cor: string;
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
  imagem_url: "", video_id: "", publico_localizacao: "", publico_idade_min: 25, publico_idade_max: 55,
};

const CHUNK_SIZE = 4 * 1024 * 1024; // 4 MB
const MAX_POLLING = 20;
const POLLING_INTERVAL = 3000;

export default function TrafegoPainel({ papel }: { papel: Papel }) {
  const base = `/api/${papel}/trafego`;

  const [conta, setConta] = useState<Conta>(undefined as unknown as Conta);
  const [campanhas, setCampanhas] = useState<Campanha[]>([]);
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [aba, setAba] = useState<"campanhas" | "alertas" | "conta">("campanhas");

  // Formulario nova campanha
  const [mostraForm, setMostraForm] = useState(false);
  const [form, setForm] = useState(FORM_VAZIO);
  const [submetendo, setSubmetendo] = useState(false);
  const [erroForm, setErroForm] = useState("");

  // Agente copy
  const [gerandoCopy, setGerandoCopy] = useState(false);
  const [variacoes, setVariacoes] = useState<CopyVariacao[]>([]);
  const [tipoVeiculo, setTipoVeiculo] = useState("carro");
  const [diferencial, setDiferencial] = useState("");

  // Upload de video — chunked
  const [uploadProgresso, setUploadProgresso] = useState(0);
  const [videoStatus, setVideoStatus] = useState<VideoStatus>("idle");
  const [erroVideo, setErroVideo] = useState("");
  const [nomeVideo, setNomeVideo] = useState("");
  const videoFileRef = useRef<string>("");

  // Formulario conta
  const [formConta, setFormConta] = useState({ meta_access_token: "", meta_ad_account_id: "", meta_page_id: "", meta_instagram_actor_id: "", openai_api_key: "" });
  const [salvandoConta, setSalvandoConta] = useState(false);
  const [erroConta, setErroConta] = useState("");
  const [sucessoConta, setSucessoConta] = useState("");

  // Orcamento inline
  const [editandoOrcamento, setEditandoOrcamento] = useState<string | null>(null);
  const [novoOrcamento, setNovoOrcamento] = useState("");

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

  const handleVideoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Valida tipo
    if (!file.type.startsWith("video/")) {
      setErroVideo("Selecione um arquivo de video valido (MP4, MOV ou AVI).");
      return;
    }
    // Valida tamanho maximo 500 MB
    const MAX_BYTES = 500 * 1024 * 1024;
    if (file.size > MAX_BYTES) {
      setErroVideo("Video muito grande. Maximo 500 MB.");
      return;
    }

    setErroVideo("");
    setNomeVideo(file.name);
    videoFileRef.current = file.name;
    setForm(f => ({ ...f, video_id: "" }));
    setVideoStatus("uploading");
    setUploadProgresso(0);

    try {
      // Fase 1: iniciar sessao de upload
      const iniciarRes = await fetch(`${base}/video/iniciar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: file.name, tamanho: file.size }),
      });
      const iniciar = await iniciarRes.json() as {
        upload_session_id?: string; video_id?: string; start_offset?: number; end_offset?: number; error?: string;
      };
      if (!iniciarRes.ok || !iniciar.upload_session_id || !iniciar.video_id) {
        setErroVideo(iniciar.error ?? "Erro ao iniciar upload");
        setVideoStatus("erro");
        return;
      }

      const video_id = iniciar.video_id;
      let start_offset = iniciar.start_offset ?? 0;
      let end_offset = iniciar.end_offset ?? Math.min(CHUNK_SIZE, file.size);

      // Fase 2: enviar chunks
      while (start_offset < file.size) {
        const chunk = file.slice(start_offset, end_offset);
        const fd = new FormData();
        fd.append("chunk", chunk, "chunk.bin");
        fd.append("upload_session_id", iniciar.upload_session_id);
        fd.append("start_offset", String(start_offset));
        fd.append("end_offset", String(end_offset));

        const chunkRes = await fetch(`${base}/video/chunk`, { method: "POST", body: fd });
        const chunkJson = await chunkRes.json() as { start_offset?: number; end_offset?: number; error?: string };

        if (!chunkRes.ok) {
          setErroVideo(chunkJson.error ?? "Erro ao enviar chunk");
          setVideoStatus("erro");
          return;
        }

        // Meta retorna os proximos offsets
        const newStart = chunkJson.start_offset ?? end_offset;
        const newEnd = chunkJson.end_offset ?? Math.min(newStart + CHUNK_SIZE, file.size);
        setUploadProgresso(Math.round((newStart / file.size) * 100));
        start_offset = newStart;
        end_offset = newEnd;

        if (newStart >= file.size) break;
      }

      setUploadProgresso(100);
      setVideoStatus("processando");

      // Fase 3: polling de status
      let tentativas = 0;
      const poll = async (): Promise<void> => {
        if (tentativas >= MAX_POLLING) {
          setErroVideo("Tempo limite de processamento atingido. O video pode ainda estar sendo processado pelo Meta.");
          setVideoStatus("erro");
          return;
        }
        tentativas++;
        const statusRes = await fetch(`${base}/video/${video_id}/status`);
        const statusJson = await statusRes.json() as { pronto?: boolean; progresso?: number; erro?: string };

        if (statusJson.erro) {
          setErroVideo(statusJson.erro);
          setVideoStatus("erro");
          return;
        }
        if (statusJson.pronto) {
          setForm(f => ({ ...f, video_id }));
          setVideoStatus("pronto");
          return;
        }
        await new Promise<void>(res => setTimeout(res, POLLING_INTERVAL));
        await poll();
      };
      await poll();

    } catch (err) {
      setErroVideo(err instanceof Error ? err.message : "Falha de conexao ao enviar video. Tente novamente.");
      setVideoStatus("erro");
    }
  };

  const resetVideo = () => {
    setVideoStatus("idle");
    setErroVideo("");
    setNomeVideo("");
    setUploadProgresso(0);
    setForm(f => ({ ...f, video_id: "" }));
  };

  const criarCampanha = async (e: React.FormEvent) => {
    e.preventDefault(); setErroForm(""); setSubmetendo(true);
    try {
      const payload = {
        ...form,
        orcamento_diario: Number(form.orcamento_diario),
        publico_idade_min: Number(form.publico_idade_min),
        publico_idade_max: Number(form.publico_idade_max),
        video_id: form.video_id || undefined,
        imagem_url: form.imagem_url || undefined,
      };
      const r = await fetch(`${base}/campanhas`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const json = await r.json();
      if (!r.ok) { setErroForm(json.error ?? "Erro"); return; }
      setMostraForm(false);
      setForm(FORM_VAZIO);
      resetVideo();
      void carregar();
    } finally { setSubmetendo(false); }
  };

  const alterarStatus = async (id: string, status: "ativa" | "pausada") => {
    try {
      await fetch(`${base}/campanhas/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    } catch {
      // falha silenciosa; recarrega para refletir estado real
    }
    void carregar();
  };

  const encerrar = async (id: string) => {
    if (!confirm("Encerrar campanha?")) return;
    try {
      await fetch(`${base}/campanhas/${id}`, { method: "DELETE" });
    } catch {
      // falha silenciosa; recarrega para refletir estado real
    }
    void carregar();
  };

  const aumentarOrcamento = async (id: string) => {
    const valor = parseFloat(novoOrcamento.replace(",", "."));
    if (isNaN(valor) || valor < 5) { alert("Valor minimo e R$5"); return; }
    try {
      await fetch(`${base}/campanhas/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orcamento_diario: valor }),
      });
    } catch {
      // falha silenciosa
    }
    setEditandoOrcamento(null);
    setNovoOrcamento("");
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

                  <div>
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Call to Action</label>
                    <select className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2" value={form.copy_cta} onChange={e => setForm(f => ({ ...f, copy_cta: e.target.value }))}>
                      {CTA_OPCOES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>

                  {/* Upload de video — chunked */}
                  <div>
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Vídeo do anúncio</label>

                    {videoStatus === "idle" && (
                      <label className="flex items-center gap-3 w-full px-4 py-3 rounded-lg border-2 border-dashed border-border hover:border-violet-500/40 hover:bg-violet-500/5 cursor-pointer transition-colors">
                        <input type="file" accept="video/mp4,video/mov,video/avi,video/quicktime" className="hidden" onChange={e => void handleVideoChange(e)} />
                        <Video className="h-5 w-5 text-muted-foreground shrink-0" />
                        <div>
                          <p className="text-xs font-semibold text-foreground">Clique para enviar o vídeo</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">MP4, MOV ou AVI — máx. 500 MB</p>
                        </div>
                        <Upload className="h-4 w-4 text-muted-foreground ml-auto shrink-0" />
                      </label>
                    )}

                    {videoStatus === "uploading" && (
                      <div className="w-full px-4 py-3 rounded-lg border-2 border-dashed border-violet-500/40 bg-violet-500/5 space-y-2">
                        <div className="flex items-center gap-2">
                          <RefreshCw className="h-4 w-4 text-violet-400 animate-spin shrink-0" />
                          <p className="text-xs font-semibold text-violet-400">Enviando para o Meta... {uploadProgresso}%</p>
                        </div>
                        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-violet-500 rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgresso}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {videoStatus === "processando" && (
                      <div className="flex items-center gap-3 w-full px-4 py-3 rounded-lg border-2 border-dashed border-amber-500/40 bg-amber-500/5">
                        <RefreshCw className="h-5 w-5 text-amber-400 animate-spin shrink-0" />
                        <div>
                          <p className="text-xs font-semibold text-amber-400">Meta está processando o vídeo...</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">Pode levar até 1 minuto</p>
                        </div>
                      </div>
                    )}

                    {videoStatus === "pronto" && (
                      <div className="flex items-center gap-3 w-full px-4 py-3 rounded-lg border-2 border-dashed border-emerald-500/40 bg-emerald-500/5">
                        <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-emerald-400">Vídeo pronto</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{nomeVideo}</p>
                        </div>
                        <button type="button" onClick={resetVideo} className="text-[10px] text-violet-400 underline shrink-0">Trocar</button>
                      </div>
                    )}

                    {videoStatus === "erro" && (
                      <div className="flex items-center gap-3 w-full px-4 py-3 rounded-lg border-2 border-dashed border-red-500/40 bg-red-500/5">
                        <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-red-400">Erro no upload</p>
                          {erroVideo && <p className="text-[10px] text-muted-foreground mt-0.5">{erroVideo}</p>}
                        </div>
                        <button type="button" onClick={resetVideo} className="text-[10px] text-violet-400 underline shrink-0">Tentar novamente</button>
                      </div>
                    )}

                    {videoStatus === "idle" && (
                      <p className="text-[10px] text-muted-foreground mt-1">Sem vídeo, o anúncio será criado somente com o texto.</p>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button type="button" onClick={() => setMostraForm(false)} className="flex-1 py-2 rounded-lg border border-border text-xs font-semibold hover:bg-accent transition-colors">Cancelar</button>
                    <button type="submit" disabled={submetendo || videoStatus === "uploading" || videoStatus === "processando"} className="flex-2 px-6 py-2 rounded-lg bg-violet-500 hover:bg-violet-600 text-white text-xs font-bold transition-colors disabled:opacity-50">
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

                          {/* Metricas da campanha */}
                          {c.insights && (
                            <div className={cn(
                              "flex items-center gap-3 mt-2 text-[11px] flex-wrap",
                              c.insights.cpl > 30 || c.insights.ctr < 0.5
                                ? "text-red-400"
                                : "text-emerald-400"
                            )}>
                              <span className="flex items-center gap-1" title="Gasto 7 dias">
                                <DollarSign className="h-3 w-3" /> {fmtBrl(c.insights.gasto)}
                              </span>
                              <span className="flex items-center gap-1" title="Leads 7 dias">
                                <Users className="h-3 w-3" /> {fmt(c.insights.leads)} leads
                              </span>
                              <span className="flex items-center gap-1" title="Custo por lead">
                                <Target className="h-3 w-3" /> CPL {fmtBrl(c.insights.cpl)}
                              </span>
                              <span className="flex items-center gap-1" title="Taxa de cliques">
                                <MousePointerClick className="h-3 w-3" /> {c.insights.ctr.toFixed(2)}% CTR
                              </span>
                              <span className="flex items-center gap-1" title="Impressoes">
                                <Eye className="h-3 w-3" /> {fmt(c.insights.impressoes)} imp.
                              </span>
                            </div>
                          )}

                          {/* Orcamento inline */}
                          {editandoOrcamento === c.id && (
                            <div className="flex items-center gap-2 mt-2">
                              <input
                                type="number"
                                min={5}
                                className="w-24 text-xs bg-background border border-border rounded px-2 py-1"
                                placeholder="R$"
                                value={novoOrcamento}
                                onChange={e => setNovoOrcamento(e.target.value)}
                                autoFocus
                              />
                              <button
                                onClick={() => void aumentarOrcamento(c.id)}
                                className="text-[10px] px-2 py-1 rounded bg-violet-500 text-white font-semibold"
                              >Salvar</button>
                              <button
                                onClick={() => { setEditandoOrcamento(null); setNovoOrcamento(""); }}
                                className="text-[10px] text-muted-foreground underline"
                              >Cancelar</button>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {c.status === "ativa" && c.insights && c.insights.leads > 0 && editandoOrcamento !== c.id && (
                            <button
                              onClick={() => { setEditandoOrcamento(c.id); setNovoOrcamento(String(c.orcamento_diario)); }}
                              className="p-1.5 rounded-lg border border-border hover:bg-violet-500/10 hover:border-violet-500/30 transition-colors text-violet-400 text-xs font-bold"
                              title="Aumentar orcamento"
                            >+</button>
                          )}
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

              </CardContent>
            </Card>

            {/* Guia Meta */}
            <Card>
              <CardHeader className="pb-3 border-b border-border">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white text-[10px] font-black shrink-0">f</span>
                  Como obter o Token e IDs do Meta
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <p className="text-xs text-muted-foreground">Siga os passos abaixo. Voce precisara de uma conta no <strong className="text-foreground">Meta Business Suite</strong> e de uma pagina do Facebook ativa.</p>

                {([
                  {
                    n: "1",
                    titulo: "Crie sua conta no Meta Business Suite",
                    desc: "Acesse business.facebook.com e clique em \"Criar conta\". Use seu perfil pessoal do Facebook para entrar. Preencha nome da empresa, seu nome e e-mail comercial.",
                    link: "https://business.facebook.com",
                    linkLabel: "Abrir Meta Business Suite",
                    cor: "bg-blue-500/10 border-blue-500/20",
                  },
                  {
                    n: "2",
                    titulo: "Crie uma conta de anuncios",
                    desc: "Dentro do Business Suite, va em Configuracoes > Contas > Contas de Anuncios > Adicionar. Escolha \"Criar nova conta de anuncios\". O ID aparece no formato act_XXXXXXXXX — copie este numero.",
                    dica: "ID da conta de anuncios = act_XXXXXXXXX",
                    cor: "bg-violet-500/10 border-violet-500/20",
                  },
                  {
                    n: "3",
                    titulo: "Conecte sua pagina do Facebook e Instagram",
                    desc: "Em Configuracoes > Contas > Paginas, adicione sua pagina do Facebook. Depois va em Contas > Contas do Instagram e conecte seu perfil do Instagram. O ID da pagina do Facebook aparece na URL da pagina ou em Configuracoes da pagina > Sobre.",
                    dica: "ID da pagina = numero de 15 digitos na URL da sua pagina",
                    cor: "bg-pink-500/10 border-pink-500/20",
                  },
                  {
                    n: "4",
                    titulo: "Gere o Access Token",
                    desc: "Va em Configuracoes > Usuarios > Usuarios do Sistema. Crie um usuario do sistema (Admin). Clique em \"Gerar novo token\", selecione sua conta de anuncios e marque as permissoes: ads_management e ads_read. Clique em Gerar Token e copie — ele aparece apenas uma vez.",
                    dica: "Guarde o token em local seguro. Comeca com EAAxxxxxxx",
                    cor: "bg-amber-500/10 border-amber-500/20",
                  },
                  {
                    n: "5",
                    titulo: "Adicione credito de pagamento",
                    desc: "Va em Faturamento no menu lateral e adicione um cartao de credito ou metodo de pagamento. Os anuncios so rodam quando ha limite disponivel na conta.",
                    cor: "bg-emerald-500/10 border-emerald-500/20",
                  },
                ] as GuiaStep[]).map(step => (
                  <div key={step.n} className={`p-4 rounded-xl border ${step.cor}`}>
                    <div className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-foreground/10 flex items-center justify-center text-xs font-black text-foreground shrink-0 mt-0.5">{step.n}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-foreground">{step.titulo}</p>
                        <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{step.desc}</p>
                        {step.dica && (
                          <p className="text-[10px] font-mono bg-background border border-border rounded px-2 py-1 mt-2 text-muted-foreground">{step.dica}</p>
                        )}
                        {step.link && (
                          <a href={step.link} target="_blank" rel="noopener noreferrer" className="inline-block mt-2 text-[11px] text-blue-400 hover:text-blue-300 underline underline-offset-2">{step.linkLabel ?? step.link} →</a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Guia OpenAI */}
            <Card>
              <CardHeader className="pb-3 border-b border-border">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z"/></svg>
                  </span>
                  Como criar conta OpenAI e obter sua chave de API
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <p className="text-xs text-muted-foreground">A chave OpenAI e opcional. Ela ativa o agente que gera textos de anuncio automaticamente. Voce paga apenas pelo que usar — em media menos de R$ 0,10 por geracao de copy.</p>

                {([
                  {
                    n: "1",
                    titulo: "Crie sua conta na OpenAI",
                    desc: "Acesse platform.openai.com e clique em \"Sign up\". Voce pode entrar com Google, Microsoft ou e-mail. Confirme seu e-mail quando solicitado.",
                    link: "https://platform.openai.com/signup",
                    linkLabel: "Criar conta OpenAI",
                    cor: "bg-emerald-500/10 border-emerald-500/20",
                  },
                  {
                    n: "2",
                    titulo: "Adicione credito (minimo USD 5)",
                    desc: "Apos logar, va em Settings > Billing > Add payment method. Adicione um cartao de credito. Depois clique em \"Add to credit balance\" e adicione pelo menos USD 5,00 (equivale a centenas de geracoes de copy).",
                    dica: "USD 5 = ~R$ 25. Suficiente para meses de uso normal.",
                    cor: "bg-blue-500/10 border-blue-500/20",
                  },
                  {
                    n: "3",
                    titulo: "Gere sua chave de API",
                    desc: "Va em API Keys no menu lateral (ou acesse platform.openai.com/api-keys). Clique em \"Create new secret key\". Copie a chave que aparece — ela comeca com sk-... e e mostrada apenas uma vez.",
                    dica: "Chave no formato: sk-proj-xxxxxxxxxxxxxxxxxx",
                    cor: "bg-amber-500/10 border-amber-500/20",
                  },
                  {
                    n: "4",
                    titulo: "Cole a chave aqui no painel",
                    desc: "No formulario acima, campo \"Chave OpenAI\", cole a chave copiada e salve. Pronto — o botao \"Gerar 3 variacoes de copy\" estara disponivel ao criar uma campanha.",
                    cor: "bg-violet-500/10 border-violet-500/20",
                  },
                ] as GuiaStep[]).map(step => (
                  <div key={step.n} className={`p-4 rounded-xl border ${step.cor}`}>
                    <div className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-foreground/10 flex items-center justify-center text-xs font-black text-foreground shrink-0 mt-0.5">{step.n}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-foreground">{step.titulo}</p>
                        <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{step.desc}</p>
                        {step.dica && (
                          <p className="text-[10px] font-mono bg-background border border-border rounded px-2 py-1 mt-2 text-muted-foreground">{step.dica}</p>
                        )}
                        {step.link && (
                          <a href={step.link} target="_blank" rel="noopener noreferrer" className="inline-block mt-2 text-[11px] text-emerald-400 hover:text-emerald-300 underline underline-offset-2">{step.linkLabel ?? step.link} →</a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
