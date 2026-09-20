"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Save, Copy, Check } from "lucide-react";
import { detectarTipoPix, corTipoPix } from "@/lib/pix-utils";

interface Perfil {
  nome: string;
  telefone: string;
  chave_pix: string | null;
}

function IconePix({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 512 512" className={className} fill="currentColor" aria-hidden="true">
      <path d="M342.5 229.5l-80-80c-3.1-3.1-8.2-3.1-11.3 0l-80 80c-3.1 3.1-3.1 8.2 0 11.3l80 80c3.1 3.1 8.2 3.1 11.3 0l80-80c3.1-3.1 3.1-8.2 0-11.3zm-85.7 74.4l-68.7-68.7 68.7-68.7 68.7 68.7-68.7 68.7zM256 8C119 8 8 119 8 256s111 248 248 248 248-111 248-248S393 8 256 8zm0 448c-110.5 0-200-89.5-200-200S145.5 56 256 56s200 89.5 200 200-89.5 200-200 200z"/>
    </svg>
  );
}

export default function IndicadorPerfilPage() {
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [chavePix, setChavePix] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    fetch("/api/indicador/perfil")
      .then((r) => { if (!r.ok) throw new Error(String(r.status)); return r.json(); })
      .then((d: Perfil) => {
        setPerfil(d);
        setChavePix(d.chave_pix ?? "");
      })
      .catch(() => {})
      .finally(() => setCarregando(false));
  }, []);

  const salvar = async () => {
    setSalvando(true);
    setMsg(null);
    try {
      const res = await fetch("/api/indicador/perfil", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chave_pix: chavePix.trim() || null }),
      });
      const json = await res.json();
      if (!res.ok) {
        setMsg({ tipo: "erro", texto: json.error ?? "Erro ao salvar" });
      } else {
        setMsg({ tipo: "ok", texto: "Chave PIX salva com sucesso!" });
        setTimeout(() => setMsg(null), 3000);
      }
    } catch {
      setMsg({ tipo: "erro", texto: "Erro de conexão" });
    } finally {
      setSalvando(false);
    }
  };

  const copiar = async () => {
    if (!chavePix.trim()) return;
    await navigator.clipboard.writeText(chavePix.trim());
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const infoPix = detectarTipoPix(chavePix);

  if (carregando) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-sm text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="px-8 py-5 border-b border-border">
        <h1 className="text-base font-bold text-foreground">Meu Perfil</h1>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          Cadastre sua chave PIX para receber comissões pelo consultor
        </p>
      </div>

      <div className="flex-1 p-8 bg-muted/30">
        <div className="max-w-lg space-y-4">

          {/* Dados do indicador */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <User className="h-4 w-4 text-amber-500" />
                Seus Dados
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Nome</label>
                <div className="px-3 py-2 bg-muted/40 rounded-lg text-sm text-foreground border border-border">
                  {perfil?.nome ?? ""}
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">WhatsApp</label>
                <div className="px-3 py-2 bg-muted/40 rounded-lg text-sm text-foreground border border-border font-mono">
                  {perfil?.telefone ?? ""}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Chave PIX */}
          <Card className="shadow-sm border-t-4 border-t-emerald-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <IconePix className="h-4 w-4 text-emerald-500" />
                Chave PIX para Receber Comissões
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground">
                Quando o consultor fechar uma venda indicada por você, ele vai usar esta chave para fazer o pagamento.
                Pode ser CPF, CNPJ, telefone, e-mail ou chave aleatória.
              </p>

              {msg && (
                <div className={`text-xs px-3 py-2 rounded-lg border ${msg.tipo === "ok" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400" : "bg-red-500/10 border-red-500/30 text-red-500"}`}>
                  {msg.texto}
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Sua Chave PIX
                  </label>
                  {chavePix.trim() && (
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${corTipoPix(infoPix.tipo)}`}>
                      {infoPix.label}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chavePix}
                    onChange={(e) => setChavePix(e.target.value)}
                    placeholder="CPF, CNPJ, telefone, e-mail ou chave aleatória"
                    className="flex-1 px-3 py-2.5 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all font-mono"
                  />
                  {chavePix.trim() && (
                    <button
                      type="button"
                      onClick={copiar}
                      title="Copiar chave"
                      className="px-3 py-2.5 rounded-lg border border-border bg-background hover:bg-accent text-muted-foreground transition-colors"
                    >
                      {copiado ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                    </button>
                  )}
                </div>
                {chavePix.trim() && infoPix.descricao && (
                  <p className="text-[11px] text-muted-foreground mt-1">{infoPix.descricao}</p>
                )}
              </div>

              <button
                type="button"
                onClick={salvar}
                disabled={salvando}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-colors disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {salvando ? "Salvando..." : "Salvar Chave PIX"}
              </button>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
