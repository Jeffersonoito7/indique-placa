"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Globe, Phone, Mail, MapPin, Building2, Save, CheckCircle2 } from "lucide-react";

type Config = {
  nome_plataforma: string;
  site?: string | null;
  email?: string | null;
  telefone?: string | null;
  endereco?: string | null;
};

const VAZIO: Config = { nome_plataforma: "", site: "", email: "", telefone: "", endereco: "" };

export default function ConfiguracoesPage() {
  const [form, setForm] = useState<Config>(VAZIO);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    fetch("/api/master/configuracoes")
      .then((r) => r.json())
      .then(({ config }) => {
        if (config) setForm({
          nome_plataforma: config.nome_plataforma ?? "",
          site: config.site ?? "",
          email: config.email ?? "",
          telefone: config.telefone ?? "",
          endereco: config.endereco ?? "",
        });
      })
      .finally(() => setCarregando(false));
  }, []);

  const salvar = async () => {
    setSalvando(true);
    setErro("");
    setSucesso(false);
    try {
      const r = await fetch("/api/master/configuracoes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await r.json();
      if (!r.ok) { setErro(json.error ?? "Erro ao salvar"); return; }
      setSucesso(true);
      setTimeout(() => setSucesso(false), 3000);
    } finally {
      setSalvando(false);
    }
  };

  const campo = (
    label: string,
    field: keyof Config,
    Icon: React.ElementType,
    placeholder: string,
    type = "text"
  ) => (
    <div>
      <label className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </label>
      <input
        type={type}
        value={form[field] ?? ""}
        onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
      />
    </div>
  );

  return (
    <div className="flex-1 flex flex-col">
      <div className="px-8 py-5 border-b border-border flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-foreground">Configurações</h1>
          <p className="text-[11px] text-muted-foreground mt-0.5">Dados e parâmetros da plataforma</p>
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

      <div className="flex-1 p-8 bg-muted/30">
        {carregando ? (
          <div className="text-sm text-muted-foreground">Carregando...</div>
        ) : (
          <div className="max-w-xl space-y-5">
            {erro && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-500">{erro}</div>
            )}

            <Card className="shadow-sm">
              <CardHeader className="pb-3 border-b border-border">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  Identidade da Plataforma
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-5">
                {campo("Nome da plataforma", "nome_plataforma", Building2, "Ex: Indique Placa")}
                {campo("Site oficial", "site", Globe, "Ex: https://indiqueplaca.com.br", "url")}
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="pb-3 border-b border-border">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  Contato
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-5">
                {campo("E-mail de contato", "email", Mail, "Ex: contato@indiqueplaca.com.br", "email")}
                {campo("WhatsApp / Telefone", "telefone", Phone, "Ex: 5511999999999")}
                {campo("Endereço", "endereco", MapPin, "Ex: Rua das Flores, 100 - São Paulo/SP")}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
