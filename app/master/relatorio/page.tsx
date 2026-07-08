"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, ClipboardList, CheckCircle2, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

type LinhaRelatorio = {
  id: string;
  nome: string;
  fone: string;
  ativo: boolean;
  total_indicacoes: number;
  total_fechadas: number;
  taxa_conversao: number;
  total_comissoes: number;
};

type RespostaAPI = {
  relatorio: LinhaRelatorio[];
  de: string | null;
  ate: string | null;
};

function formatarMoeda(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatarDataBR(iso: string) {
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano}`;
}

function SkeletonLinha() {
  return (
    <tr className="border-b border-border">
      {Array.from({ length: 6 }).map((_, i) => (
        <td key={i} className="px-6 py-3.5">
          <div className="h-4 bg-muted rounded animate-pulse w-full" />
        </td>
      ))}
    </tr>
  );
}

export default function RelatorioPage() {
  const [relatorio, setRelatorio] = useState<LinhaRelatorio[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [periodoAtual, setPeriodoAtual] = useState<{ de: string | null; ate: string | null }>({ de: null, ate: null });

  const [de, setDe] = useState("");
  const [ate, setAte] = useState("");

  const buscar = useCallback(async (filtroDE: string, filtroATE: string) => {
    setCarregando(true);
    try {
      const params = new URLSearchParams();
      if (filtroDE) params.set("de", filtroDE);
      if (filtroATE) params.set("ate", filtroATE);
      const url = "/api/master/relatorio" + (params.toString() ? "?" + params.toString() : "");
      const res = await fetch(url);
      if (!res.ok) throw new Error("Erro ao carregar");
      const json = await res.json() as RespostaAPI;
      setRelatorio(json.relatorio);
      setPeriodoAtual({ de: json.de, ate: json.ate });
    } catch {
      // falha silenciosa; mantém estado anterior
    } finally {
      setCarregando(false);
    }
  }, []);

  // Carga inicial sem filtro
  useEffect(() => {
    void buscar("", "");
  }, [buscar]);

  function handleFiltrar() {
    void buscar(de, ate);
  }

  function handleLimpar() {
    setDe("");
    setAte("");
    void buscar("", "");
  }

  const totalAtivos = relatorio.filter((r) => r.ativo).length;
  const totalIndicacoes = relatorio.reduce((acc, r) => acc + r.total_indicacoes, 0);
  const totalFechadas = relatorio.reduce((acc, r) => acc + r.total_fechadas, 0);
  const taxaMedia = totalIndicacoes > 0 ? Math.round((totalFechadas / totalIndicacoes) * 100) : 0;
  const maxTotal = Math.max(...relatorio.map((r) => r.total_indicacoes), 1);

  const cards = [
    { label: "Consultores ativos", valor: totalAtivos, icon: Users, cor: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Total de indicacoes", valor: totalIndicacoes, icon: ClipboardList, cor: "text-amber-500", bg: "bg-amber-500/10" },
    { label: "Vendas fechadas", valor: totalFechadas, icon: CheckCircle2, cor: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "Taxa de conversao media", valor: `${taxaMedia}%`, icon: TrendingUp, cor: "text-violet-500", bg: "bg-violet-500/10" },
  ];

  const legendaPeriodo = periodoAtual.de && periodoAtual.ate
    ? `Exibindo: ${formatarDataBR(periodoAtual.de)} ate ${formatarDataBR(periodoAtual.ate)}`
    : periodoAtual.de
    ? `Exibindo: a partir de ${formatarDataBR(periodoAtual.de)}`
    : periodoAtual.ate
    ? `Exibindo: ate ${formatarDataBR(periodoAtual.ate)}`
    : "Exibindo: todos os periodos";

  return (
    <div className="flex-1 flex flex-col">
      <div className="px-8 py-5 border-b border-border flex items-start justify-between">
        <div>
          <h1 className="text-base font-bold text-foreground">Relatorio de Consultores</h1>
          <p className="text-[11px] text-muted-foreground mt-0.5">{legendaPeriodo}</p>
        </div>

        {/* Filtro de data */}
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <div className="flex items-center gap-1.5">
            <label className="text-[11px] text-muted-foreground font-medium">De</label>
            <input
              type="date"
              value={de}
              onChange={(e) => setDe(e.target.value)}
              className="text-xs px-2 py-1.5 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <label className="text-[11px] text-muted-foreground font-medium">Ate</label>
            <input
              type="date"
              value={ate}
              onChange={(e) => setAte(e.target.value)}
              className="text-xs px-2 py-1.5 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <button
            onClick={handleFiltrar}
            disabled={carregando}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-foreground text-background hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            Filtrar
          </button>
          <button
            onClick={handleLimpar}
            disabled={carregando}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-muted transition-colors disabled:opacity-50"
          >
            Limpar
          </button>
        </div>
      </div>

      <div className="flex-1 p-8 bg-muted/30 space-y-6">
        {/* Cards de resumo */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((c) => {
            const Icon = c.icon;
            return (
              <Card key={c.label} className="shadow-sm">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", c.bg)}>
                    <Icon className={cn("h-5 w-5", c.cor)} />
                  </div>
                  <div>
                    <div className="text-xl font-bold text-foreground">{c.valor}</div>
                    <div className="text-[11px] text-muted-foreground leading-tight">{c.label}</div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Tabela */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle className="text-sm font-semibold">Desempenho por Consultor</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {!carregando && relatorio.length === 0 ? (
              <div className="text-center text-muted-foreground text-sm py-16">Nenhum dado disponivel ainda.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px]">
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      {["Consultor", "Indicacoes", "Fechadas", "Conversao", "Comissoes geradas", "Status"].map((h) => (
                        <th
                          key={h}
                          className="text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-6 py-3"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {carregando
                      ? Array.from({ length: 5 }).map((_, i) => <SkeletonLinha key={i} />)
                      : relatorio.map((item, i) => {
                          let badgeCor = "bg-red-100 text-red-800";
                          if (item.taxa_conversao >= 30) badgeCor = "bg-green-100 text-green-800";
                          else if (item.taxa_conversao >= 15) badgeCor = "bg-yellow-100 text-yellow-800";

                          return (
                            <tr
                              key={item.id}
                              className={cn(
                                "border-b border-border hover:bg-accent/40 transition-colors",
                                i % 2 !== 0 && "bg-muted/20"
                              )}
                            >
                              <td className="px-6 py-3.5">
                                <div className="text-sm font-medium text-foreground">{item.nome}</div>
                                <div className="text-[10px] text-muted-foreground">{item.fone}</div>
                              </td>

                              <td className="px-6 py-3.5">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-mono w-6 text-right shrink-0">{item.total_indicacoes}</span>
                                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden min-w-[60px]">
                                    <div
                                      className="h-full bg-amber-500 rounded-full"
                                      style={{ width: `${Math.min((item.total_indicacoes / maxTotal) * 100, 100)}%` }}
                                    />
                                  </div>
                                </div>
                              </td>

                              <td className="px-6 py-3.5">
                                <span className="text-sm font-bold text-emerald-500">{item.total_fechadas}</span>
                              </td>

                              <td className="px-6 py-3.5">
                                <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold", badgeCor)}>
                                  {item.taxa_conversao}%
                                </span>
                              </td>

                              <td className="px-6 py-3.5 text-sm text-foreground">
                                {formatarMoeda(item.total_comissoes)}
                              </td>

                              <td className="px-6 py-3.5">
                                <span
                                  className={cn(
                                    "inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold",
                                    item.ativo ? "bg-emerald-100 text-emerald-800" : "bg-muted text-muted-foreground"
                                  )}
                                >
                                  {item.ativo ? "Ativo" : "Inativo"}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
