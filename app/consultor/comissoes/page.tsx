"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Save } from "lucide-react";

interface ComissaoTipo {
  tipo: "moto" | "carro" | "caminhao";
  label: string;
  icone: string;
  comissao_indicador: number;
  ativo: boolean;
}

const ICONES: Record<string, string> = {
  moto: "Moto",
  carro: "Carro",
  caminhao: "Caminhao",
};

function moeda(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function ComissoesPage() {
  const [comissoes, setComissoes] = useState<ComissaoTipo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState<string | null>(null);
  const [mensagens, setMensagens] = useState<Record<string, { tipo: "ok" | "erro"; texto: string }>>({});

  useEffect(() => {
    fetch("/api/consultor/comissoes")
      .then((r) => r.json())
      .then((d: ComissaoTipo[]) => setComissoes(d))
      .catch(() => {})
      .finally(() => setCarregando(false));
  }, []);

  const atualizar = (tipo: string, campo: keyof ComissaoTipo, valor: unknown) => {
    setComissoes((prev) =>
      prev.map((c) => (c.tipo === tipo ? { ...c, [campo]: valor } : c))
    );
  };

  const salvar = async (comissao: ComissaoTipo) => {
    setSalvando(comissao.tipo);
    setMensagens((prev) => ({ ...prev, [comissao.tipo]: undefined as any }));
    try {
      const res = await fetch("/api/consultor/comissoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(comissao),
      });
      const json = await res.json();
      if (!res.ok) {
        setMensagens((prev) => ({ ...prev, [comissao.tipo]: { tipo: "erro", texto: json.error ?? "Erro ao salvar" } }));
      } else {
        setMensagens((prev) => ({ ...prev, [comissao.tipo]: { tipo: "ok", texto: "Salvo com sucesso!" } }));
        setTimeout(() => setMensagens((prev) => ({ ...prev, [comissao.tipo]: undefined as any })), 2500);
      }
    } catch {
      setMensagens((prev) => ({ ...prev, [comissao.tipo]: { tipo: "erro", texto: "Erro de conexao" } }));
    } finally {
      setSalvando(null);
    }
  };

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
        <h1 className="text-base font-bold text-foreground">Comissoes por Tipo de Veiculo</h1>
        <p className="text-[11px] text-muted-foreground mt-0.5">Defina quanto cada indicador ganha por fechamento</p>
      </div>
      <div className="flex-1 p-8 bg-muted/30">
        <div className="max-w-2xl grid grid-cols-1 gap-4">
          {comissoes.map((c) => {
            const msg = mensagens[c.tipo];
            return (
              <Card key={c.tipo} className={`shadow-sm border-t-4 ${c.ativo ? "border-t-emerald-500" : "border-t-muted"}`}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-emerald-500" />
                      {ICONES[c.icone] ?? c.label}
                    </span>
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <span className="text-xs font-medium text-muted-foreground">{c.ativo ? "Ativo" : "Inativo"}</span>
                      <button
                        type="button"
                        onClick={() => atualizar(c.tipo, "ativo", !c.ativo)}
                        className={`relative w-10 h-5 rounded-full transition-colors ${c.ativo ? "bg-emerald-500" : "bg-muted-foreground/30"}`}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${c.ativo ? "translate-x-5" : "translate-x-0"}`}
                        />
                      </button>
                    </label>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-2 space-y-4">
                  {msg && (
                    <div className={`text-xs px-3 py-2 rounded-lg border ${msg.tipo === "ok" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400" : "bg-red-500/10 border-red-500/30 text-red-500"}`}>
                      {msg.texto}
                    </div>
                  )}
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                      Comissao por fechamento (R$)
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-muted-foreground">R$</span>
                      <input
                        type="number"
                        min={0}
                        step={1}
                        value={c.comissao_indicador}
                        onChange={(e) => atualizar(c.tipo, "comissao_indicador", Number(e.target.value))}
                        className="w-36 px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all font-mono"
                      />
                      <span className="text-xs text-muted-foreground">= {moeda(c.comissao_indicador)}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => salvar(c)}
                    disabled={salvando === c.tipo}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-colors disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                    {salvando === c.tipo ? "Salvando..." : "Salvar"}
                  </button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
