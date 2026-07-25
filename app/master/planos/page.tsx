"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, Building2, Users, ShieldCheck, Infinity } from "lucide-react";
import { cn } from "@/lib/utils";

interface PlanoAssociacao {
  plano: string;
  max_consultores: number | null;
  max_gestores: number | null;
  max_indicadores: number | null;
  campanha_whatsapp: boolean;
  exportar_csv: boolean;
  bi_avancado: boolean;
  webhook_integracao: boolean;
  logo_personalizada: boolean;
  suporte_prioritario: boolean;
}

interface PlanoConsultor {
  plano: string;
  max_indicadores: number | null;
  campanha_whatsapp: boolean;
  exportar_csv: boolean;
  metas_bonus: boolean;
  link_captura_proprio: boolean;
  ranking_visivel: boolean;
}

interface PlanoGestor {
  plano: string;
  max_consultores: number | null;
  relatorios_equipe: boolean;
  exportar_csv: boolean;
  link_captura_proprio: boolean;
}

type Aba = "associacao" | "consultor" | "gestor";

const CORES_ASSOC: Record<string, string> = {
  trial:  "border-t-amber-500",
  bronze: "border-t-slate-400",
  prata:  "border-t-cyan-400",
  ouro:   "border-t-yellow-400",
};

const CORES_PLANO: Record<string, string> = {
  trial:  "bg-amber-500/10 text-amber-500",
  bronze: "bg-slate-500/10 text-slate-400",
  prata:  "bg-cyan-500/10 text-cyan-400",
  ouro:   "bg-yellow-500/10 text-yellow-400",
  free:   "bg-muted text-muted-foreground",
  pro:    "bg-violet-500/10 text-violet-400",
};

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={cn(
        "relative w-11 h-6 rounded-full transition-colors flex-shrink-0",
        value ? "bg-emerald-500" : "bg-muted-foreground/30"
      )}
    >
      <span className={cn(
        "absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform",
        value ? "translate-x-5" : "translate-x-0"
      )} />
    </button>
  );
}

function NumInput({
  value,
  onChange,
  placeholder,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
  placeholder?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        min={1}
        value={value ?? ""}
        placeholder={placeholder ?? "Ilimitado"}
        onChange={(e) => {
          const v = e.target.value;
          onChange(v === "" ? null : parseInt(v, 10));
        }}
        className="w-28 px-3 py-1.5 text-sm rounded-lg border border-border bg-background font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
      />
      {value !== null && (
        <button
          type="button"
          title="Ilimitado"
          onClick={() => onChange(null)}
          className="text-muted-foreground hover:text-blue-500 transition-colors"
        >
          <Infinity className="h-4 w-4" />
        </button>
      )}
      {value === null && (
        <span className="text-xs text-emerald-500 font-semibold flex items-center gap-1">
          <Infinity className="h-3 w-3" /> Ilimitado
        </span>
      )}
    </div>
  );
}

function PermRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
      <span className="text-sm text-foreground">{label}</span>
      {children}
    </div>
  );
}

export default function PlanosPage() {
  const [aba, setAba] = useState<Aba>("associacao");
  const [associacao, setAssociacao] = useState<PlanoAssociacao[]>([]);
  const [consultor, setConsultor] = useState<PlanoConsultor[]>([]);
  const [gestor, setGestor] = useState<PlanoGestor[]>([]);
  const [salvando, setSalvando] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<Record<string, { ok: boolean; texto: string }>>({});
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    fetch("/api/master/planos")
      .then((r) => r.json())
      .then((d) => {
        setAssociacao(d.associacao ?? []);
        setConsultor(d.consultor ?? []);
        setGestor(d.gestor ?? []);
      })
      .finally(() => setCarregando(false));
  }, []);

  const setMsg = (key: string, m: { ok: boolean; texto: string } | null) => {
    setMsgs((prev) => ({ ...prev, [key]: m as never }));
  };

  const salvar = async (tipo: Aba, dados: unknown, plano: string) => {
    const key = `${tipo}-${plano}`;
    setSalvando(key);
    setMsg(key, null);
    try {
      const res = await fetch("/api/master/planos", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo, dados }),
      });
      if (res.ok) {
        setMsg(key, { ok: true, texto: "Salvo!" });
        setTimeout(() => setMsg(key, null), 2500);
      } else {
        const j = await res.json();
        setMsg(key, { ok: false, texto: j.error ?? "Erro ao salvar" });
      }
    } catch {
      setMsg(key, { ok: false, texto: "Erro de conexão" });
    } finally {
      setSalvando(null);
    }
  };

  const updAssoc = (plano: string, campo: keyof PlanoAssociacao, valor: unknown) => {
    setAssociacao((prev) => prev.map((p) => p.plano === plano ? { ...p, [campo]: valor } : p));
  };

  const updConsultor = (plano: string, campo: keyof PlanoConsultor, valor: unknown) => {
    setConsultor((prev) => prev.map((p) => p.plano === plano ? { ...p, [campo]: valor } : p));
  };

  const updGestor = (plano: string, campo: keyof PlanoGestor, valor: unknown) => {
    setGestor((prev) => prev.map((p) => p.plano === plano ? { ...p, [campo]: valor } : p));
  };

  const abas: { id: Aba; label: string; icon: React.ReactNode }[] = [
    { id: "associacao", label: "Associações", icon: <Building2 className="h-4 w-4" /> },
    { id: "consultor",  label: "Consultores",  icon: <Users className="h-4 w-4" /> },
    { id: "gestor",     label: "Gestores",     icon: <ShieldCheck className="h-4 w-4" /> },
  ];

  return (
    <div className="flex-1 flex flex-col">
      <div className="px-8 py-5 border-b border-border">
        <h1 className="text-base font-bold text-foreground">Configuração de Planos</h1>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          Defina limites e permissões de cada plano. As regras são aplicadas automaticamente em todas as contas.
        </p>
      </div>

      {/* Abas */}
      <div className="flex gap-1 px-8 pt-5 border-b border-border">
        {abas.map((a) => (
          <button
            key={a.id}
            onClick={() => setAba(a.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-t-lg border border-b-0 transition-colors",
              aba === a.id
                ? "bg-background border-border text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {a.icon}
            {a.label}
          </button>
        ))}
      </div>

      <div className="flex-1 p-8 bg-muted/30">
        {carregando && (
          <div className="text-sm text-muted-foreground">Carregando...</div>
        )}

        {/* Associacoes */}
        {!carregando && aba === "associacao" && (
          <div className="grid grid-cols-2 gap-5 max-w-5xl">
            {associacao.map((p) => {
              const key = `associacao-${p.plano}`;
              const msg = msgs[key];
              return (
                <Card key={p.plano} className={cn("shadow-sm border-t-4", CORES_ASSOC[p.plano] ?? "border-t-border")}>
                  <CardHeader className="pb-2 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded uppercase", CORES_PLANO[p.plano])}>
                        {p.plano}
                      </span>
                    </CardTitle>
                    <button
                      onClick={() => salvar("associacao", p, p.plano)}
                      disabled={salvando === key}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors disabled:opacity-50"
                    >
                      <Save className="h-3 w-3" />
                      {salvando === key ? "Salvando..." : "Salvar"}
                    </button>
                  </CardHeader>
                  <CardContent className="pt-1">
                    {msg && (
                      <div className={cn("text-xs px-3 py-2 rounded-lg mb-3 border", msg.ok
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                        : "bg-red-500/10 border-red-500/30 text-red-500"
                      )}>{msg.texto}</div>
                    )}
                    <PermRow label="Máx. Consultores">
                      <NumInput value={p.max_consultores} onChange={(v) => updAssoc(p.plano, "max_consultores", v)} />
                    </PermRow>
                    <PermRow label="Máx. Gestores">
                      <NumInput value={p.max_gestores} onChange={(v) => updAssoc(p.plano, "max_gestores", v)} />
                    </PermRow>
                    <PermRow label="Máx. Indicadores">
                      <NumInput value={p.max_indicadores} onChange={(v) => updAssoc(p.plano, "max_indicadores", v)} />
                    </PermRow>
                    <PermRow label="Campanha WhatsApp">
                      <Toggle value={p.campanha_whatsapp} onChange={(v) => updAssoc(p.plano, "campanha_whatsapp", v)} />
                    </PermRow>
                    <PermRow label="Exportar CSV">
                      <Toggle value={p.exportar_csv} onChange={(v) => updAssoc(p.plano, "exportar_csv", v)} />
                    </PermRow>
                    <PermRow label="BI Avançado">
                      <Toggle value={p.bi_avancado} onChange={(v) => updAssoc(p.plano, "bi_avancado", v)} />
                    </PermRow>
                    <PermRow label="Webhook / Integração API">
                      <Toggle value={p.webhook_integracao} onChange={(v) => updAssoc(p.plano, "webhook_integracao", v)} />
                    </PermRow>
                    <PermRow label="Logo personalizada">
                      <Toggle value={p.logo_personalizada} onChange={(v) => updAssoc(p.plano, "logo_personalizada", v)} />
                    </PermRow>
                    <PermRow label="Suporte prioritário">
                      <Toggle value={p.suporte_prioritario} onChange={(v) => updAssoc(p.plano, "suporte_prioritario", v)} />
                    </PermRow>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Consultores */}
        {!carregando && aba === "consultor" && (
          <div className="grid grid-cols-2 gap-5 max-w-3xl">
            {consultor.map((p) => {
              const key = `consultor-${p.plano}`;
              const msg = msgs[key];
              return (
                <Card key={p.plano} className={cn("shadow-sm border-t-4", p.plano === "pro" ? "border-t-violet-500" : "border-t-slate-400")}>
                  <CardHeader className="pb-2 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded uppercase", CORES_PLANO[p.plano])}>
                        {p.plano}
                      </span>
                    </CardTitle>
                    <button
                      onClick={() => salvar("consultor", p, p.plano)}
                      disabled={salvando === key}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors disabled:opacity-50"
                    >
                      <Save className="h-3 w-3" />
                      {salvando === key ? "Salvando..." : "Salvar"}
                    </button>
                  </CardHeader>
                  <CardContent className="pt-1">
                    {msg && (
                      <div className={cn("text-xs px-3 py-2 rounded-lg mb-3 border", msg.ok
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                        : "bg-red-500/10 border-red-500/30 text-red-500"
                      )}>{msg.texto}</div>
                    )}
                    <PermRow label="Máx. Indicadores">
                      <NumInput value={p.max_indicadores} onChange={(v) => updConsultor(p.plano, "max_indicadores", v)} />
                    </PermRow>
                    <PermRow label="Campanha WhatsApp">
                      <Toggle value={p.campanha_whatsapp} onChange={(v) => updConsultor(p.plano, "campanha_whatsapp", v)} />
                    </PermRow>
                    <PermRow label="Exportar CSV">
                      <Toggle value={p.exportar_csv} onChange={(v) => updConsultor(p.plano, "exportar_csv", v)} />
                    </PermRow>
                    <PermRow label="Metas e Bônus">
                      <Toggle value={p.metas_bonus} onChange={(v) => updConsultor(p.plano, "metas_bonus", v)} />
                    </PermRow>
                    <PermRow label="Link de captura próprio">
                      <Toggle value={p.link_captura_proprio} onChange={(v) => updConsultor(p.plano, "link_captura_proprio", v)} />
                    </PermRow>
                    <PermRow label="Aparece no ranking">
                      <Toggle value={p.ranking_visivel} onChange={(v) => updConsultor(p.plano, "ranking_visivel", v)} />
                    </PermRow>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Gestores */}
        {!carregando && aba === "gestor" && (
          <div className="grid grid-cols-2 gap-5 max-w-3xl">
            {gestor.map((p) => {
              const key = `gestor-${p.plano}`;
              const msg = msgs[key];
              return (
                <Card key={p.plano} className={cn("shadow-sm border-t-4", p.plano === "pro" ? "border-t-violet-500" : "border-t-slate-400")}>
                  <CardHeader className="pb-2 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded uppercase", CORES_PLANO[p.plano])}>
                        {p.plano}
                      </span>
                    </CardTitle>
                    <button
                      onClick={() => salvar("gestor", p, p.plano)}
                      disabled={salvando === key}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors disabled:opacity-50"
                    >
                      <Save className="h-3 w-3" />
                      {salvando === key ? "Salvando..." : "Salvar"}
                    </button>
                  </CardHeader>
                  <CardContent className="pt-1">
                    {msg && (
                      <div className={cn("text-xs px-3 py-2 rounded-lg mb-3 border", msg.ok
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                        : "bg-red-500/10 border-red-500/30 text-red-500"
                      )}>{msg.texto}</div>
                    )}
                    <PermRow label="Máx. Consultores na equipe">
                      <NumInput value={p.max_consultores} onChange={(v) => updGestor(p.plano, "max_consultores", v)} />
                    </PermRow>
                    <PermRow label="Relatórios de equipe">
                      <Toggle value={p.relatorios_equipe} onChange={(v) => updGestor(p.plano, "relatorios_equipe", v)} />
                    </PermRow>
                    <PermRow label="Exportar CSV">
                      <Toggle value={p.exportar_csv} onChange={(v) => updGestor(p.plano, "exportar_csv", v)} />
                    </PermRow>
                    <PermRow label="Link de captura próprio">
                      <Toggle value={p.link_captura_proprio} onChange={(v) => updGestor(p.plano, "link_captura_proprio", v)} />
                    </PermRow>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
