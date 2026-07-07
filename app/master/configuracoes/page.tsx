"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Globe, Phone, Mail, MapPin, Building2, Save, CheckCircle2, DollarSign, User, Image, Palette, Link, Copy, Check } from "lucide-react";

type Config = {
  nome_plataforma: string;
  nome_associacao: string;
  slogan: string;
  site: string;
  email: string;
  telefone: string;
  endereco: string;
  logo_url: string;
  cor_primaria: string;
  comissao_consultor: number;
  comissao_indicador: number;
  consultor_padrao_id: string;
};

const VAZIO: Config = {
  nome_plataforma: "",
  nome_associacao: "",
  slogan: "",
  site: "",
  email: "",
  telefone: "",
  endereco: "",
  logo_url: "",
  cor_primaria: "#f59e0b",
  comissao_consultor: 50,
  comissao_indicador: 20,
  consultor_padrao_id: "",
};

const CORES_SUGERIDAS = [
  { hex: "#f59e0b", nome: "Dourado" },
  { hex: "#3b82f6", nome: "Azul" },
  { hex: "#10b981", nome: "Verde" },
  { hex: "#ef4444", nome: "Vermelho" },
  { hex: "#8b5cf6", nome: "Roxo" },
  { hex: "#f97316", nome: "Laranja" },
  { hex: "#06b6d4", nome: "Ciano" },
  { hex: "#ec4899", nome: "Rosa" },
];

export default function ConfiguracoesPage() {
  const [form, setForm] = useState<Config>(VAZIO);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState("");
  const [copiado, setCopiado] = useState(false);
  const [uploadando, setUploadando] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const linkBase = typeof window !== "undefined" ? `${window.location.origin}/indicador/cadastro` : "https://indiqueplaca.com.br/indicador/cadastro";

  useEffect(() => {
    fetch("/api/master/configuracoes")
      .then((r) => r.json())
      .then(({ config }) => {
        if (config) setForm({
          nome_plataforma: config.nome_plataforma ?? "",
          nome_associacao: config.nome_associacao ?? "",
          slogan: config.slogan ?? "",
          site: config.site ?? "",
          email: config.email ?? "",
          telefone: config.telefone ?? "",
          endereco: config.endereco ?? "",
          logo_url: config.logo_url ?? "",
          cor_primaria: config.cor_primaria ?? "#f59e0b",
          comissao_consultor: config.comissao_consultor ?? 50,
          comissao_indicador: config.comissao_indicador ?? 20,
          consultor_padrao_id: config.consultor_padrao_id ?? "",
        });
      })
      .finally(() => setCarregando(false));
  }, []);

  const salvar = async () => {
    setSalvando(true); setErro(""); setSucesso(false);
    try {
      const body = {
        ...form,
        nome_plataforma: form.nome_plataforma || "Indique Placa",
        comissao_consultor: Number(form.comissao_consultor) || 50,
        comissao_indicador: Number(form.comissao_indicador) || 20,
        logo_url: form.logo_url || null,
        slogan: form.slogan || null,
        nome_associacao: form.nome_associacao || null,
        consultor_padrao_id: form.consultor_padrao_id || null,
      };
      const r = await fetch("/api/master/configuracoes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await r.json();
      if (!r.ok) { setErro(json.error ?? "Erro ao salvar"); return; }
      setSucesso(true);
      setTimeout(() => setSucesso(false), 3000);
    } finally { setSalvando(false); }
  };

  const copiarLink = () => {
    navigator.clipboard.writeText(linkBase);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const uploadLogo = async (file: File) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setErro("Logo deve ter no máximo 2MB"); return; }
    setUploadando(true);
    try {
      const ext = file.name.split(".").pop();
      const nome = `logo-${Date.now()}.${ext}`;
      const { createClient } = await import("@supabase/supabase-js");
      const sb = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { error } = await sb.storage.from("logos").upload(nome, file, { upsert: true });
      if (error) { setErro("Erro ao enviar logo: " + error.message); return; }
      const { data } = sb.storage.from("logos").getPublicUrl(nome);
      setForm(f => ({ ...f, logo_url: data.publicUrl }));
    } finally { setUploadando(false); }
  };

  const set = (field: keyof Config) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  return (
    <div className="flex-1 flex flex-col">
      <div className="px-8 py-5 border-b border-border flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-foreground">Configurações da Plataforma</h1>
          <p className="text-[11px] text-muted-foreground mt-0.5">Personalize o sistema para cada associação cliente</p>
        </div>
        <button
          onClick={salvar}
          disabled={salvando || carregando}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors disabled:opacity-50"
        >
          {sucesso ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
          {salvando ? "Salvando..." : sucesso ? "Salvo!" : "Salvar alterações"}
        </button>
      </div>

      <div className="flex-1 p-8 bg-muted/30 overflow-y-auto">
        {carregando ? (
          <div className="text-sm text-muted-foreground">Carregando...</div>
        ) : (
          <div className="max-w-2xl space-y-5">
            {erro && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-500">{erro}</div>}

            {/* Como funciona */}
            <Card className="shadow-sm border-blue-500/30 bg-blue-500/5">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Link className="h-4 w-4 text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-foreground mb-1">Como vender para uma associação</div>
                    <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside leading-relaxed">
                      <li>Cadastre um consultor para a associação na aba <strong>Consultores</strong></li>
                      <li>Personalize o logo, cor e nome abaixo para identidade visual da associação</li>
                      <li>Copie o link de cadastro e envie para o consultor distribuir entre seus indicadores</li>
                      <li>O consultor gerencia os leads pelo painel. Quando fechar, registra o pagamento ao indicador</li>
                    </ol>
                    <div className="mt-3 flex items-center gap-2">
                      <div className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-xs font-mono text-muted-foreground truncate">
                        {linkBase}
                      </div>
                      <button
                        onClick={copiarLink}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors flex-shrink-0"
                      >
                        {copiado ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        {copiado ? "Copiado!" : "Copiar link"}
                      </button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Identidade visual */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3 border-b border-border">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Palette className="h-4 w-4 text-muted-foreground" />
                  Identidade Visual (White-label)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Logo */}
                <div>
                  <label className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                    <Image className="h-3.5 w-3.5" />
                    Logo da associação
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-xl border-2 border-dashed border-border bg-muted/40 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {form.logo_url
                        ? <img src={form.logo_url} alt="Logo" className="w-full h-full object-contain p-1" />
                        : <Image className="h-7 w-7 text-muted-foreground/40" />
                      }
                    </div>
                    <div className="flex-1">
                      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && uploadLogo(e.target.files[0])} />
                      <button
                        onClick={() => fileRef.current?.click()}
                        disabled={uploadando}
                        className="px-4 py-2 rounded-lg border border-border bg-background hover:bg-accent text-xs font-semibold transition-colors disabled:opacity-50"
                      >
                        {uploadando ? "Enviando..." : "Escolher imagem"}
                      </button>
                      <p className="text-[10px] text-muted-foreground mt-1.5">PNG, JPG ou SVG. Máximo 2MB.</p>
                      {form.logo_url && (
                        <button onClick={() => setForm(f => ({ ...f, logo_url: "" }))} className="text-[10px] text-red-500 hover:underline mt-1">
                          Remover logo
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Cor primaria */}
                <div>
                  <label className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                    <Palette className="h-3.5 w-3.5" />
                    Cor principal
                  </label>
                  <div className="flex items-center gap-3 flex-wrap">
                    {CORES_SUGERIDAS.map(c => (
                      <button
                        key={c.hex}
                        title={c.nome}
                        onClick={() => setForm(f => ({ ...f, cor_primaria: c.hex }))}
                        className="w-8 h-8 rounded-full border-2 transition-all"
                        style={{
                          background: c.hex,
                          borderColor: form.cor_primaria === c.hex ? "#fff" : "transparent",
                          boxShadow: form.cor_primaria === c.hex ? `0 0 0 3px ${c.hex}` : "none",
                        }}
                      />
                    ))}
                    <div className="flex items-center gap-2 ml-2">
                      <input
                        type="color"
                        value={form.cor_primaria}
                        onChange={set("cor_primaria")}
                        className="w-8 h-8 rounded-full cursor-pointer border-0 p-0 bg-transparent"
                        title="Cor personalizada"
                      />
                      <span className="text-xs text-muted-foreground font-mono">{form.cor_primaria}</span>
                    </div>
                  </div>
                  <div className="mt-3 h-2 rounded-full" style={{ background: form.cor_primaria, opacity: 0.8 }} />
                </div>

                {/* Nome e slogan */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                      <Building2 className="h-3.5 w-3.5" />
                      Nome da associação
                    </label>
                    <input
                      type="text"
                      value={form.nome_associacao}
                      onChange={set("nome_associacao")}
                      placeholder="Ex: AutoVale Prevencoes"
                      className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                      <Settings className="h-3.5 w-3.5" />
                      Slogan
                    </label>
                    <input
                      type="text"
                      value={form.slogan}
                      onChange={set("slogan")}
                      placeholder="Ex: Protecao que vale a pena"
                      className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>

                {/* Preview */}
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Preview do cabeçalho</div>
                  <div className="rounded-xl border border-border overflow-hidden">
                    <div className="h-1.5" style={{ background: form.cor_primaria }} />
                    <div className="p-4 bg-background flex items-center gap-3">
                      {form.logo_url
                        ? <img src={form.logo_url} alt="Logo" className="h-9 object-contain" />
                        : <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-xs font-black" style={{ background: form.cor_primaria }}>
                            {(form.nome_associacao || form.nome_plataforma || "IP").slice(0, 2).toUpperCase()}
                          </div>
                      }
                      <div>
                        <div className="text-sm font-bold text-foreground">{form.nome_associacao || form.nome_plataforma || "Nome da Associação"}</div>
                        {form.slogan && <div className="text-[10px] text-muted-foreground">{form.slogan}</div>}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contato */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3 border-b border-border">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  Contato e Localização
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />Email</label>
                    <input type="email" value={form.email} onChange={set("email")} placeholder="contato@associacao.com.br"
                      className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all" />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />WhatsApp</label>
                    <input type="text" value={form.telefone} onChange={set("telefone")} placeholder="5587999999999"
                      className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all" />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5"><Globe className="h-3.5 w-3.5" />Site</label>
                  <input type="url" value={form.site} onChange={set("site")} placeholder="https://www.associacao.com.br"
                    className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all" />
                </div>
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />Endereço</label>
                  <input type="text" value={form.endereco} onChange={set("endereco")} placeholder="Rua das Flores, 100 - Petrolina/PE"
                    className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all" />
                </div>
              </CardContent>
            </Card>

            {/* Comissoes */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3 border-b border-border">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  Comissões Padrão por Lead Fechado
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5"><DollarSign className="h-3.5 w-3.5" />Consultor (R$)</label>
                    <input type="number" min={0} step={1} value={form.comissao_consultor} onChange={set("comissao_consultor")}
                      className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all" />
                    <p className="text-[10px] text-muted-foreground mt-1">Pago ao consultor por lead fechado</p>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5"><DollarSign className="h-3.5 w-3.5" />Indicador (R$)</label>
                    <input type="number" min={0} step={1} value={form.comissao_indicador} onChange={set("comissao_indicador")}
                      className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all" />
                    <p className="text-[10px] text-muted-foreground mt-1">Pago ao indicador por lead fechado</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Roteamento */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3 border-b border-border">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  Roteamento de Leads
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5"><User className="h-3.5 w-3.5" />Consultor padrão (ID)</label>
                <input type="text" value={form.consultor_padrao_id} onChange={set("consultor_padrao_id")}
                  placeholder="UUID do consultor (ex: a1b2c3d4-...)"
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all" />
                <p className="text-[10px] text-muted-foreground mt-1">Recebe leads de indicações públicas sem consultor vinculado</p>
              </CardContent>
            </Card>

          </div>
        )}
      </div>
    </div>
  );
}
