"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Building2, CheckCircle2, Clock, XCircle, Plus, Search,
  Pencil, Eye, Ban, X, Eye as EyeIcon, EyeOff,
} from "lucide-react";

interface Associacao {
  id: string;
  nome: string;
  slug: string;
  status: string;
  plano: string;
  cidade: string | null;
  estado: string | null;
  criado_em: string;
  total_gestores: number;
  total_consultores: number;
  total_indicadores: number;
  total_leads: number;
}

interface AssociacaoDetalhe extends Associacao {
  email: string | null;
  fone: string | null;
  logo_url: string | null;
  plano_ativo_ate: string | null;
  cobranca_ativa: boolean;
  valor_mensalidade_associacao: number;
  valor_mensalidade_gestor: number;
  valor_mensalidade_consultor_pro: number;
  efi_client_id: string | null;
  efi_client_secret: string | null;
  efi_pix_key: string | null;
}

const statusStyle: Record<string, string> = {
  ativo: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  inativo: "bg-red-500/10 text-red-600 dark:text-red-400",
  trial: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  suspenso: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
};

const planoStyle: Record<string, string> = {
  trial: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  bronze: "bg-slate-500/10 text-slate-500",
  pro: "bg-violet-500/10 text-violet-500",
  ouro: "bg-blue-500/10 text-blue-500",
};

function gerarSlug(nome: string) {
  return nome
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function ModalNovaAssociacao({ onClose, onSalvo }: { onClose: () => void; onSalvo: () => void }) {
  const [form, setForm] = useState({ nome: "", slug: "", email: "", fone: "", cidade: "", estado: "", plano: "trial" });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const set = (k: string, v: string) => {
    setForm((f) => {
      const next = { ...f, [k]: v };
      if (k === "nome") next.slug = gerarSlug(v);
      return next;
    });
  };

  const salvar = async () => {
    setSalvando(true);
    setErro("");
    const res = await fetch("/api/master/associacoes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSalvando(false);
    if (!res.ok) {
      const json = await res.json();
      setErro(typeof json.error === "string" ? json.error : "Erro ao salvar");
      return;
    }
    onSalvo();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-sm font-bold">Nova Associacao</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-accent transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-6 grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Nome</label>
            <input
              className="w-full h-9 px-3 rounded-lg border border-border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40"
              value={form.nome}
              onChange={(e) => set("nome", e.target.value)}
              placeholder="Ex: Associacao Centro-Oeste"
            />
          </div>
          <div className="col-span-2">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Slug</label>
            <input
              className="w-full h-9 px-3 rounded-lg border border-border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40 font-mono"
              value={form.slug}
              onChange={(e) => set("slug", e.target.value)}
              placeholder="associacao-centro-oeste"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Email</label>
            <input
              className="w-full h-9 px-3 rounded-lg border border-border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="email@exemplo.com"
              type="email"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Telefone</label>
            <input
              className="w-full h-9 px-3 rounded-lg border border-border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40"
              value={form.fone}
              onChange={(e) => set("fone", e.target.value)}
              placeholder="(00) 00000-0000"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Cidade</label>
            <input
              className="w-full h-9 px-3 rounded-lg border border-border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40"
              value={form.cidade}
              onChange={(e) => set("cidade", e.target.value)}
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Estado</label>
            <input
              className="w-full h-9 px-3 rounded-lg border border-border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40"
              value={form.estado}
              onChange={(e) => set("estado", e.target.value)}
              placeholder="PE"
              maxLength={2}
            />
          </div>
          <div className="col-span-2">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Plano</label>
            <select
              className="w-full h-9 px-3 rounded-lg border border-border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40"
              value={form.plano}
              onChange={(e) => set("plano", e.target.value)}
            >
              <option value="trial">Trial</option>
              <option value="bronze">Bronze</option>
              <option value="prata">Prata</option>
              <option value="ouro">Ouro</option>
            </select>
          </div>
          {erro && <p className="col-span-2 text-xs text-red-500">{erro}</p>}
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
          <button onClick={onClose} className="h-9 px-4 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
            Cancelar
          </button>
          <button
            onClick={salvar}
            disabled={salvando || !form.nome || !form.slug}
            className="h-9 px-5 rounded-lg text-sm font-semibold bg-violet-500 text-white hover:bg-violet-600 disabled:opacity-50 transition-colors"
          >
            {salvando ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ModalEditarAssociacao({ assoc, onClose, onSalvo }: { assoc: AssociacaoDetalhe; onClose: () => void; onSalvo: () => void }) {
  const [aba, setAba] = useState<"dados" | "cobranca">("dados");
  const [form, setForm] = useState({
    nome: assoc.nome,
    slug: assoc.slug,
    email: assoc.email ?? "",
    fone: assoc.fone ?? "",
    cidade: assoc.cidade ?? "",
    estado: assoc.estado ?? "",
    status: assoc.status,
    plano: assoc.plano,
    cobranca_ativa: assoc.cobranca_ativa,
    valor_mensalidade_associacao: assoc.valor_mensalidade_associacao,
    valor_mensalidade_gestor: assoc.valor_mensalidade_gestor,
    valor_mensalidade_consultor_pro: assoc.valor_mensalidade_consultor_pro,
    efi_client_id: assoc.efi_client_id ?? "",
    efi_client_secret: assoc.efi_client_secret ?? "",
    efi_pix_key: assoc.efi_pix_key ?? "",
    nova_senha: "",
  });
  const [mostrarSecret, setMostrarSecret] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const set = (k: string, v: string | boolean | number) =>
    setForm((f) => ({ ...f, [k]: v }));

  const salvar = async () => {
    setSalvando(true);
    setErro("");
    const res = await fetch(`/api/master/associacoes/${assoc.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        email: form.email || null,
        efi_client_id: form.efi_client_id || null,
        efi_client_secret: form.efi_client_secret || null,
        efi_pix_key: form.efi_pix_key || null,
        nova_senha: form.nova_senha || undefined,
      }),
    });
    setSalvando(false);
    if (!res.ok) {
      const json = await res.json();
      setErro(typeof json.error === "string" ? json.error : "Erro ao salvar");
      return;
    }
    onSalvo();
    onClose();
  };

  const inputCls = "w-full h-9 px-3 rounded-lg border border-border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40";
  const labelCls = "text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <h2 className="text-sm font-bold">Editar: {assoc.nome}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-accent transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex gap-1 px-6 pt-4 flex-shrink-0">
          {(["dados", "cobranca"] as const).map((a) => (
            <button
              key={a}
              onClick={() => setAba(a)}
              className={cn(
                "h-8 px-4 rounded-lg text-xs font-semibold transition-colors",
                aba === a ? "bg-violet-500 text-white" : "text-muted-foreground hover:bg-accent"
              )}
            >
              {a === "dados" ? "Dados Gerais" : "Cobranca"}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto flex-1 p-6">
          {aba === "dados" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className={labelCls}>Nome</label>
                <input className={inputCls} value={form.nome} onChange={(e) => set("nome", e.target.value)} />
              </div>
              <div className="col-span-2">
                <label className={labelCls}>Slug</label>
                <input className={cn(inputCls, "font-mono")} value={form.slug} onChange={(e) => set("slug", e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Email</label>
                <input className={inputCls} value={form.email} onChange={(e) => set("email", e.target.value)} type="email" />
              </div>
              <div>
                <label className={labelCls}>Telefone</label>
                <input className={inputCls} value={form.fone} onChange={(e) => set("fone", e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Cidade</label>
                <input className={inputCls} value={form.cidade} onChange={(e) => set("cidade", e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Estado</label>
                <input className={inputCls} value={form.estado} onChange={(e) => set("estado", e.target.value)} maxLength={2} />
              </div>
              <div>
                <label className={labelCls}>Status</label>
                <select className={inputCls} value={form.status} onChange={(e) => set("status", e.target.value)}>
                  <option value="ativo">Ativo</option>
                  <option value="trial">Trial</option>
                  <option value="suspenso">Suspenso</option>
                  <option value="inativo">Inativo</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Plano</label>
                <select className={inputCls} value={form.plano} onChange={(e) => set("plano", e.target.value)}>
                  <option value="trial">Trial</option>
                  <option value="bronze">Bronze</option>
                  <option value="prata">Prata</option>
                  <option value="ouro">Ouro</option>
                </select>
              </div>
            </div>
          )}

          {aba === "cobranca" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20">
                <div>
                  <p className="text-sm font-semibold">Cobranca Ativa</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Habilita geração de cobranças automaticas</p>
                </div>
                <button
                  onClick={() => set("cobranca_ativa", !form.cobranca_ativa)}
                  className={cn(
                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                    form.cobranca_ativa ? "bg-violet-500" : "bg-muted-foreground/30"
                  )}
                >
                  <span
                    className={cn(
                      "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                      form.cobranca_ativa ? "translate-x-6" : "translate-x-1"
                    )}
                  />
                </button>
              </div>

              <div>
                <label className={labelCls}>Mensalidade Associacao (R$)</label>
                <input
                  className={inputCls}
                  type="number"
                  min={0}
                  step={0.01}
                  value={form.valor_mensalidade_associacao}
                  onChange={(e) => set("valor_mensalidade_associacao", parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <label className={labelCls}>Mensalidade Gestor (R$)</label>
                <input
                  className={inputCls}
                  type="number"
                  min={0}
                  step={0.01}
                  value={form.valor_mensalidade_gestor}
                  onChange={(e) => set("valor_mensalidade_gestor", parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="col-span-2">
                <label className={labelCls}>Mensalidade Consultor Pro (R$)</label>
                <input
                  className={inputCls}
                  type="number"
                  min={0}
                  step={0.01}
                  value={form.valor_mensalidade_consultor_pro}
                  onChange={(e) => set("valor_mensalidade_consultor_pro", parseFloat(e.target.value) || 0)}
                />
              </div>

              <div className="col-span-2">
                <label className={labelCls}>Senha de Acesso da Associacao</label>
                <input
                  className={inputCls}
                  type="password"
                  placeholder="Deixe em branco para nao alterar"
                  value={form.nova_senha}
                  onChange={(e) => set("nova_senha", e.target.value)}
                  autoComplete="new-password"
                />
                <p className="text-[10px] text-muted-foreground mt-1">Senha usada para a associacao acessar o proprio painel.</p>
              </div>

              <div className="col-span-2">
                <label className={labelCls}>Efi Client ID</label>
                <input className={inputCls} value={form.efi_client_id} onChange={(e) => set("efi_client_id", e.target.value)} />
              </div>
              <div className="col-span-2">
                <label className={labelCls}>Efi Client Secret</label>
                <div className="relative">
                  <input
                    className={cn(inputCls, "pr-10")}
                    type={mostrarSecret ? "text" : "password"}
                    value={form.efi_client_secret}
                    onChange={(e) => set("efi_client_secret", e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarSecret((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {mostrarSecret ? <EyeOff className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="col-span-2">
                <label className={labelCls}>Chave PIX Efi</label>
                <input className={inputCls} value={form.efi_pix_key} onChange={(e) => set("efi_pix_key", e.target.value)} />
              </div>
            </div>
          )}

          {erro && <p className="text-xs text-red-500 mt-4">{erro}</p>}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border flex-shrink-0">
          <button onClick={onClose} className="h-9 px-4 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
            Cancelar
          </button>
          <button
            onClick={salvar}
            disabled={salvando}
            className="h-9 px-5 rounded-lg text-sm font-semibold bg-violet-500 text-white hover:bg-violet-600 disabled:opacity-50 transition-colors"
          >
            {salvando ? "Salvando..." : "Salvar Alteracoes"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AssociacoesPage() {
  const [lista, setLista] = useState<Associacao[]>([]);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [filtroPlano, setFiltroPlano] = useState("");
  const [modalNova, setModalNova] = useState(false);
  const [editando, setEditando] = useState<AssociacaoDetalhe | null>(null);
  const [inativando, setInativando] = useState<string | null>(null);

  const carregar = async () => {
    const res = await fetch("/api/master/associacoes");
    if (res.ok) {
      const json = await res.json();
      setLista(json.lista ?? []);
    }
  };

  useEffect(() => { carregar(); }, []);

  const abrirEditar = async (id: string) => {
    const res = await fetch(`/api/master/associacoes/${id}`);
    if (res.ok) {
      const json = await res.json();
      setEditando(json.associacao);
    }
  };

  const inativar = async (id: string, nome: string) => {
    if (!confirm(`Inativar a associacao "${nome}"?`)) return;
    setInativando(id);
    await fetch(`/api/master/associacoes/${id}`, { method: "DELETE" });
    setInativando(null);
    carregar();
  };

  const filtrada = lista.filter((a) => {
    const ok = !busca || a.nome.toLowerCase().includes(busca.toLowerCase()) || a.slug.includes(busca.toLowerCase());
    const okS = !filtroStatus || a.status === filtroStatus;
    const okP = !filtroPlano || a.plano === filtroPlano;
    return ok && okS && okP;
  });

  const total = lista.length;
  const ativas = lista.filter((a) => a.status === "ativo").length;
  const trials = lista.filter((a) => a.status === "trial").length;
  const inativas = lista.filter((a) => a.status === "inativo").length;

  return (
    <div className="flex-1 flex flex-col">
      <div className="px-8 py-5 border-b border-border flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-foreground">Associacoes</h1>
          <p className="text-[11px] text-muted-foreground mt-0.5">Clientes white-label da plataforma</p>
        </div>
        <button
          onClick={() => setModalNova(true)}
          className="flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-semibold bg-violet-500 text-white hover:bg-violet-600 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nova Associacao
        </button>
      </div>

      <div className="flex-1 p-8 bg-muted/30">
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total", value: total, icon: Building2, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-t-blue-500" },
            { label: "Ativas", value: ativas, icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-t-emerald-500" },
            { label: "Trial", value: trials, icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10", border: "border-t-amber-500" },
            { label: "Inativas", value: inativas, icon: XCircle, color: "text-red-500", bg: "bg-red-500/10", border: "border-t-red-500" },
          ].map(({ label, value, icon: Icon, color, bg, border }) => (
            <Card key={label} className={cn("border-t-4", border)}>
              <CardContent className="p-5 flex items-center gap-3">
                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0", bg)}>
                  <Icon className={cn("h-4 w-4", color)} />
                </div>
                <div>
                  <div className={cn("text-2xl font-bold", color)}>{value}</div>
                  <div className="text-[10px] text-muted-foreground">{label}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="shadow-sm">
          <CardHeader className="pb-3 border-b border-border">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <CardTitle className="text-sm font-semibold">Lista de Associacoes</CardTitle>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    className="h-8 pl-8 pr-3 text-xs rounded-lg border border-border bg-muted/30 focus:outline-none focus:ring-2 focus:ring-violet-500/40 w-48"
                    placeholder="Buscar nome ou slug..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                  />
                </div>
                <select
                  className="h-8 px-2 text-xs rounded-lg border border-border bg-muted/30 focus:outline-none"
                  value={filtroStatus}
                  onChange={(e) => setFiltroStatus(e.target.value)}
                >
                  <option value="">Todos os status</option>
                  <option value="ativo">Ativo</option>
                  <option value="trial">Trial</option>
                  <option value="suspenso">Suspenso</option>
                  <option value="inativo">Inativo</option>
                </select>
                <select
                  className="h-8 px-2 text-xs rounded-lg border border-border bg-muted/30 focus:outline-none"
                  value={filtroPlano}
                  onChange={(e) => setFiltroPlano(e.target.value)}
                >
                  <option value="">Todos os planos</option>
                  <option value="trial">Trial</option>
                  <option value="bronze">Bronze</option>
                  <option value="prata">Prata</option>
                  <option value="ouro">Ouro</option>
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {filtrada.length === 0 ? (
              <div className="text-center text-muted-foreground text-sm py-16">Nenhuma associacao encontrada</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      {["Nome", "Slug", "Cidade/UF", "Plano", "Status", "Gestores", "Consultores", "Leads", "Desde", ""].map((h, i) => (
                        <th key={i} className="text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-4 py-3 whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtrada.map((a, i) => (
                      <tr key={a.id} className={cn("border-b border-border hover:bg-accent/40 transition-colors", i % 2 !== 0 && "bg-muted/20")}>
                        <td className="px-4 py-3 text-sm font-medium text-foreground whitespace-nowrap">{a.nome}</td>
                        <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{a.slug}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                          {a.cidade && a.estado ? `${a.cidade}/${a.estado}` : a.cidade ?? a.estado ?? "-"}
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn("text-[11px] font-semibold px-2.5 py-1 rounded-full", planoStyle[a.plano] ?? "bg-muted text-muted-foreground")}>
                            {a.plano}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn("text-[11px] font-semibold px-2.5 py-1 rounded-full", statusStyle[a.status] ?? "bg-muted text-muted-foreground")}>
                            {a.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-center text-muted-foreground">{a.total_gestores}</td>
                        <td className="px-4 py-3 text-sm text-center text-muted-foreground">{a.total_consultores}</td>
                        <td className="px-4 py-3 text-sm text-center text-muted-foreground">{a.total_leads}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(a.criado_em).toLocaleDateString("pt-BR")}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => abrirEditar(a.id)}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-violet-500 hover:bg-violet-500/10 transition-colors"
                              title="Editar"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => inativar(a.id, a.nome)}
                              disabled={inativando === a.id || a.status === "inativo"}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-40"
                              title="Inativar"
                            >
                              <Ban className="h-3.5 w-3.5" />
                            </button>
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

      {modalNova && <ModalNovaAssociacao onClose={() => setModalNova(false)} onSalvo={carregar} />}
      {editando && <ModalEditarAssociacao assoc={editando} onClose={() => setEditando(null)} onSalvo={carregar} />}
    </div>
  );
}
