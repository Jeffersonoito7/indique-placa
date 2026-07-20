"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart2, Download, Users, ClipboardList, CheckCircle2, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

type ConsultorRelatorio = {
  id: string;
  nome: string;
  email: string;
  fone: string;
  status: string;
  plano: string | null;
  leads: number;
  fechados: number;
  taxa: number;
};

type Relatorio = {
  total_consultores: number;
  total_leads: number;
  total_fechamentos: number;
  taxa_conversao: number;
  ranking: ConsultorRelatorio[];
};

function exportarCSV(dados: ConsultorRelatorio[]) {
  const cabecalho = ["Nome", "Email", "Telefone", "Plano", "Status", "Leads", "Fechamentos", "Taxa (%)"];
  const linhas = dados.map((c) => [
    `"${c.nome}"`,
    `"${c.email}"`,
    `"${c.fone ?? ""}"`,
    c.plano ?? "free",
    c.status,
    c.leads,
    c.fechados,
    c.taxa,
  ]);
  const csv = [cabecalho, ...linhas].map((l) => l.join(";")).join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `relatorio-gestor-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export default function GestorRelatorioPage() {
  const [relatorio, setRelatorio] = useState<Relatorio | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [de, setDe] = useState("");
  const [ate, setAte] = useState("");

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const params = new URLSearchParams();
      if (de) params.set("de", de);
      if (ate) params.set("ate", ate);
      const res = await fetch(`/api/gestor/relatorio?${params.toString()}`);
      if (res.ok) setRelatorio(await res.json());
    } finally {
      setCarregando(false);
    }
  }, [de, ate]);

  useEffect(() => { carregar(); }, [carregar]);

  const kpis = relatorio
    ? [
        { label: "Consultores", value: relatorio.total_consultores, icon: Users, iconBg: "bg-indigo-500/10", iconColor: "text-indigo-500", valueColor: "text-indigo-500", border: "border-t-indigo-500" },
        { label: "Total de leads", value: relatorio.total_leads, icon: ClipboardList, iconBg: "bg-blue-500/10", iconColor: "text-blue-500", valueColor: "text-blue-500", border: "border-t-blue-500" },
        { label: "Fechamentos", value: relatorio.total_fechamentos, icon: CheckCircle2, iconBg: "bg-emerald-500/10", iconColor: "text-emerald-500", valueColor: "text-emerald-500", border: "border-t-emerald-500" },
        { label: "Taxa de conversao", value: `${relatorio.taxa_conversao}%`, icon: TrendingUp, iconBg: "bg-amber-500/10", iconColor: "text-amber-500", valueColor: "text-amber-500", border: "border-t-amber-500" },
      ]
    : [];

  return (
    <div className="flex-1 flex flex-col">
      <div className="px-8 py-5 border-b border-border flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-foreground">Relatorio da Equipe</h1>
          <p className="text-[11px] text-muted-foreground mt-0.5">Desempenho consolidado por periodo</p>
        </div>
        {relatorio && relatorio.ranking.length > 0 && (
          <button
            onClick={() => exportarCSV(relatorio.ranking)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-indigo-500/30 text-indigo-500 hover:bg-indigo-500/10 text-sm font-semibold transition-colors"
          >
            <Download className="h-4 w-4" />
            Exportar CSV
          </button>
        )}
      </div>

      <div className="flex-1 p-8 bg-muted/30 space-y-6">

        {/* Filtro de periodo */}
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">De</label>
                <input
                  type="date"
                  value={de}
                  onChange={(e) => setDe(e.target.value)}
                  className="px-3 py-1.5 text-sm bg-muted border border-border rounded-lg outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Ate</label>
                <input
                  type="date"
                  value={ate}
                  onChange={(e) => setAte(e.target.value)}
                  className="px-3 py-1.5 text-sm bg-muted border border-border rounded-lg outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              {(de || ate) && (
                <button
                  onClick={() => { setDe(""); setAte(""); }}
                  className="text-xs text-muted-foreground hover:text-foreground underline transition-colors"
                >
                  Limpar filtro
                </button>
              )}
              <span className="text-[11px] text-muted-foreground">
                {de || ate ? "Periodo filtrado" : "Todos os periodos"}
              </span>
            </div>
          </CardContent>
        </Card>

        {carregando ? (
          <div className="text-center text-muted-foreground text-sm py-12">Carregando...</div>
        ) : !relatorio ? (
          <div className="text-center text-muted-foreground text-sm py-12">Erro ao carregar relatorio.</div>
        ) : (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-4 gap-4">
              {kpis.map((m) => {
                const Icon = m.icon;
                return (
                  <Card key={m.label} className={cn("border-t-4 shadow-sm", m.border)}>
                    <CardContent className="p-5">
                      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center mb-3", m.iconBg)}>
                        <Icon className={cn("h-4 w-4", m.iconColor)} />
                      </div>
                      <div className={cn("text-2xl font-bold tracking-tight mb-0.5", m.valueColor)}>{m.value}</div>
                      <p className="text-[11px] text-muted-foreground">{m.label}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Ranking detalhado */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3 border-b border-border">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <BarChart2 className="h-4 w-4 text-indigo-500" />
                  Ranking por Fechamentos
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {relatorio.ranking.length === 0 ? (
                  <div className="text-center text-muted-foreground text-sm py-10">Nenhum dado no periodo.</div>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border bg-muted/40">
                        {["#", "Consultor", "Plano", "Status", "Leads", "Fechamentos", "Taxa"].map((h) => (
                          <th key={h} className="text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-5 py-3">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {relatorio.ranking.map((c, i) => (
                        <tr key={c.id} className={cn(
                          "border-b border-border transition-colors hover:bg-accent/40",
                          i % 2 !== 0 && "bg-muted/20"
                        )}>
                          <td className="px-5 py-3.5">
                            <span className={cn(
                              "text-sm font-bold",
                              i === 0 ? "text-amber-500" : i === 1 ? "text-slate-400" : i === 2 ? "text-orange-600" : "text-muted-foreground"
                            )}>#{i + 1}</span>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="text-sm font-semibold text-foreground">{c.nome}</div>
                            <div className="text-[11px] text-muted-foreground">{c.email}</div>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={cn(
                              "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider",
                              c.plano === "pro"
                                ? "bg-indigo-500/15 text-indigo-400 border border-indigo-500/30"
                                : "bg-muted text-muted-foreground border border-border"
                            )}>
                              {c.plano ?? "free"}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={cn(
                              "text-[10px] font-semibold px-2.5 py-1 rounded-full",
                              c.status === "ativo"
                                ? "bg-emerald-500/10 text-emerald-500"
                                : "bg-red-500/10 text-red-500"
                            )}>
                              {c.status === "ativo" ? "Ativo" : "Inativo"}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-sm text-muted-foreground">{c.leads}</td>
                          <td className="px-5 py-3.5">
                            <span className="text-sm font-bold text-emerald-500">{c.fechados}</span>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2">
                              <div className="w-14 h-1.5 bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${c.taxa}%` }} />
                              </div>
                              <span className="text-xs text-muted-foreground">{c.taxa}%</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
