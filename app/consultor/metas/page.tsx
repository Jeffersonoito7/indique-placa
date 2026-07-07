"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, Plus, Trash2 } from "lucide-react";

interface Meta {
  id: string;
  nome: string;
  descricao?: string | null;
  tipo_veiculo: string;
  quantidade_indicacoes: number;
  bonus_valor: number;
  criado_em: string;
}

function moeda(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const TIPO_LABELS: Record<string, string> = {
  todos: "Todos os veiculos",
  moto: "Moto",
  carro: "Carro",
  caminhao: "Caminhao",
};

export default function MetasPage() {
  const [metas, setMetas] = useState<Meta[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [criando, setCriando] = useState(false);
  const [removendo, setRemovendo] = useState<string | null>(null);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState(false);

  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [tipoVeiculo, setTipoVeiculo] = useState("todos");
  const [quantidade, setQuantidade] = useState(10);
  const [bonus, setBonus] = useState(100);

  const carregar = () => {
    fetch("/api/consultor/metas")
      .then((r) => r.json())
      .then((d: Meta[]) => setMetas(d))
      .catch(() => {})
      .finally(() => setCarregando(false));
  };

  useEffect(() => { carregar(); }, []);

  const criar = async (e: React.FormEvent) => {
    e.preventDefault();
    setCriando(true);
    setErro("");
    setSucesso(false);
    try {
      const res = await fetch("/api/consultor/metas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: nome.trim(),
          descricao: descricao.trim() || null,
          tipo_veiculo: tipoVeiculo,
          quantidade_indicacoes: quantidade,
          bonus_valor: bonus,
        }),
      });
      const json = await res.json();
      if (!res.ok) { setErro(json.error ?? "Erro ao criar meta"); return; }
      setSucesso(true);
      setNome("");
      setDescricao("");
      setTipoVeiculo("todos");
      setQuantidade(10);
      setBonus(100);
      carregar();
      setTimeout(() => setSucesso(false), 2500);
    } catch {
      setErro("Erro de conexao. Tente novamente.");
    } finally {
      setCriando(false);
    }
  };

  const remover = async (id: string) => {
    setRemovendo(id);
    try {
      await fetch(`/api/consultor/metas?id=${id}`, { method: "DELETE" });
      setMetas((prev) => prev.filter((m) => m.id !== id));
    } catch {
    } finally {
      setRemovendo(null);
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
        <h1 className="text-base font-bold text-foreground">Metas e Bonus</h1>
        <p className="text-[11px] text-muted-foreground mt-0.5">Crie metas para motivar seus indicadores com bonus extras</p>
      </div>
      <div className="flex-1 p-8 bg-muted/30">
        <div className="max-w-2xl space-y-6">

          {/* Lista de metas */}
          {metas.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-foreground">Metas Ativas</h2>
              {metas.map((m) => (
                <Card key={m.id} className="shadow-sm border-t-4 border-t-amber-500">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Target className="h-4 w-4 text-amber-500 flex-shrink-0" />
                          <span className="text-sm font-bold text-foreground truncate">{m.nome}</span>
                        </div>
                        {m.descricao && <p className="text-xs text-muted-foreground mb-2">{m.descricao}</p>}
                        <div className="flex flex-wrap gap-2 text-xs">
                          <span className="px-2 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium">
                            {TIPO_LABELS[m.tipo_veiculo] ?? m.tipo_veiculo}
                          </span>
                          <span className="px-2 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium">
                            {m.quantidade_indicacoes} fechamentos
                          </span>
                          <span className="px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
                            Bonus: {moeda(m.bonus_valor)}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => remover(m.id)}
                        disabled={removendo === m.id}
                        className="p-2 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors disabled:opacity-50"
                        title="Desativar meta"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Formulario nova meta */}
          <Card className="shadow-sm border-t-4 border-t-emerald-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Plus className="h-4 w-4 text-emerald-500" /> Nova Meta
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <form onSubmit={criar} className="space-y-4">
                {erro && (
                  <div className="text-xs px-3 py-2 rounded-lg border bg-red-500/10 border-red-500/30 text-red-500">{erro}</div>
                )}
                {sucesso && (
                  <div className="text-xs px-3 py-2 rounded-lg border bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400">Meta criada com sucesso!</div>
                )}
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Nome da meta</label>
                  <input
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    required
                    placeholder="Ex: 10 carros em julho"
                    className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Descricao (opcional)</label>
                  <textarea
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    rows={2}
                    placeholder="Detalhes da meta..."
                    className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all resize-none"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Tipo</label>
                    <select
                      value={tipoVeiculo}
                      onChange={(e) => setTipoVeiculo(e.target.value)}
                      className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                    >
                      <option value="todos">Todos</option>
                      <option value="moto">Moto</option>
                      <option value="carro">Carro</option>
                      <option value="caminhao">Caminhao</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Fechamentos</label>
                    <input
                      type="number"
                      min={1}
                      value={quantidade}
                      onChange={(e) => setQuantidade(Number(e.target.value))}
                      required
                      className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Bonus (R$)</label>
                    <input
                      type="number"
                      min={0.01}
                      step={0.01}
                      value={bonus}
                      onChange={(e) => setBonus(Number(e.target.value))}
                      required
                      className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all font-mono"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={criando}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-colors disabled:opacity-50"
                >
                  <Plus className="h-4 w-4" />
                  {criando ? "Criando..." : "Criar meta"}
                </button>
              </form>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
