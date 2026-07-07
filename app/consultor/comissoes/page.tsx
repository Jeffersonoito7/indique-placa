"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Save, Trash2, Plus } from "lucide-react";

interface ComissaoTipo {
  tipo: string;
  label: string;
  icone: string;
  comissao_indicador: number;
  ativo: boolean;
}

function moeda(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

export default function ComissoesPage() {
  const [comissoes, setComissoes] = useState<ComissaoTipo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState<string | null>(null);
  const [excluindo, setExcluindo] = useState<string | null>(null);
  const [mensagens, setMensagens] = useState<Record<string, { tipo: "ok" | "erro"; texto: string }>>({});

  const [novoLabel, setNovoLabel] = useState("");
  const [novoValor, setNovoValor] = useState<number>(0);
  const [adicionando, setAdicionando] = useState(false);
  const [erroNovo, setErroNovo] = useState("");

  const carregar = () => {
    setCarregando(true);
    fetch("/api/consultor/comissoes")
      .then((r) => r.json())
      .then((d: ComissaoTipo[]) => setComissoes(d))
      .catch(() => {})
      .finally(() => setCarregando(false));
  };

  useEffect(() => { carregar(); }, []);

  const atualizar = (tipo: string, campo: keyof ComissaoTipo, valor: unknown) => {
    setComissoes((prev) =>
      prev.map((c) => (c.tipo === tipo ? { ...c, [campo]: valor } : c))
    );
  };

  const msgSet = (tipo: string, m: { tipo: "ok" | "erro"; texto: string } | null) => {
    setMensagens((prev) => ({ ...prev, [tipo]: m as any }));
  };

  const salvar = async (comissao: ComissaoTipo) => {
    setSalvando(comissao.tipo);
    msgSet(comissao.tipo, null);
    try {
      const res = await fetch("/api/consultor/comissoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(comissao),
      });
      const json = await res.json();
      if (!res.ok) {
        msgSet(comissao.tipo, { tipo: "erro", texto: json.error ?? "Erro ao salvar" });
      } else {
        msgSet(comissao.tipo, { tipo: "ok", texto: "Salvo com sucesso!" });
        setTimeout(() => msgSet(comissao.tipo, null), 2500);
      }
    } catch {
      msgSet(comissao.tipo, { tipo: "erro", texto: "Erro de conexão" });
    } finally {
      setSalvando(null);
    }
  };

  const excluir = async (tipo: string, label: string) => {
    if (!confirm(`Excluir o tipo "${label}"? Indicadores não poderão mais selecioná-lo.`)) return;
    setExcluindo(tipo);
    try {
      const res = await fetch("/api/consultor/comissoes", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo }),
      });
      if (res.ok) {
        setComissoes((prev) => prev.filter((c) => c.tipo !== tipo));
      } else {
        const json = await res.json();
        alert(json.error ?? "Erro ao excluir");
      }
    } catch {
      alert("Erro de conexão");
    } finally {
      setExcluindo(null);
    }
  };

  const adicionarNovo = async () => {
    const labelTrim = novoLabel.trim();
    if (!labelTrim) { setErroNovo("Informe o nome do tipo de veículo."); return; }
    if (novoValor < 0) { setErroNovo("O valor da comissão não pode ser negativo."); return; }

    const tipo = slugify(labelTrim) || `tipo_${comissoes.length + 1}`;
    if (comissoes.some((c) => c.tipo === tipo || c.label.toLowerCase() === labelTrim.toLowerCase())) {
      setErroNovo("Já existe um tipo com este nome.");
      return;
    }

    setAdicionando(true);
    setErroNovo("");
    const novo: ComissaoTipo = { tipo, label: labelTrim, icone: "custom", comissao_indicador: novoValor, ativo: true };

    try {
      const res = await fetch("/api/consultor/comissoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(novo),
      });
      if (res.ok) {
        setComissoes((prev) => [...prev, novo]);
        setNovoLabel("");
        setNovoValor(0);
      } else {
        const json = await res.json();
        setErroNovo(json.error ?? "Erro ao adicionar");
      }
    } catch {
      setErroNovo("Erro de conexão");
    } finally {
      setAdicionando(false);
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
        <h1 className="text-base font-bold text-foreground">Comissões por Tipo de Veículo</h1>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          Defina quanto cada indicador ganha por fechamento. Adicione os tipos que sua associação trabalha.
        </p>
      </div>

      <div className="flex-1 p-8 bg-muted/30">
        <div className="max-w-2xl space-y-4">

          {/* Formulário novo tipo */}
          <Card className="shadow-sm border-dashed border-2 border-emerald-500/40 bg-emerald-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                <Plus className="h-4 w-4" />
                Adicionar Tipo de Veículo
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-1 space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Nome do tipo
                  </label>
                  <input
                    type="text"
                    value={novoLabel}
                    onChange={(e) => setNovoLabel(e.target.value)}
                    placeholder="Ex: Ônibus, Van, Mototrilha..."
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Comissão (R$)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={novoValor}
                    onChange={(e) => setNovoValor(Number(e.target.value))}
                    className="w-32 px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all font-mono"
                  />
                </div>
              </div>
              {erroNovo && (
                <div className="text-xs text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                  {erroNovo}
                </div>
              )}
              <button
                type="button"
                onClick={adicionarNovo}
                disabled={adicionando}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-colors disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                {adicionando ? "Adicionando..." : "Adicionar Tipo"}
              </button>
            </CardContent>
          </Card>

          {comissoes.length === 0 && (
            <div className="text-center py-10 text-sm text-muted-foreground">
              Nenhum tipo cadastrado. Use o formulário acima para começar.
            </div>
          )}

          {comissoes.map((c) => {
            const msg = mensagens[c.tipo];
            return (
              <Card key={c.tipo} className={`shadow-sm border-t-4 ${c.ativo ? "border-t-emerald-500" : "border-t-muted"}`}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-emerald-500" />
                      <input
                        type="text"
                        value={c.label}
                        onChange={(e) => atualizar(c.tipo, "label", e.target.value)}
                        className="bg-transparent border-0 border-b border-dashed border-border focus:outline-none focus:border-emerald-500 text-sm font-semibold w-40"
                      />
                    </span>
                    <div className="flex items-center gap-3">
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
                      <button
                        type="button"
                        onClick={() => excluir(c.tipo, c.label)}
                        disabled={excluindo === c.tipo}
                        title="Excluir tipo"
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
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
                      Comissão por fechamento (R$)
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
