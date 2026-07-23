"use client";

import { useCallback, useEffect, useState } from "react";
import { Activity, RefreshCw, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type CheckStatus = "ok" | "warning" | "critical";

type Check = {
  nome: string;
  valor: number;
  limite: number | null;
  unidade: string;
  status: CheckStatus;
  mensagem: string;
};

type HealthData = {
  status: CheckStatus;
  checks: Check[];
  timestamp: string;
};

function statusColor(s: CheckStatus) {
  if (s === "ok") return "text-emerald-400";
  if (s === "warning") return "text-amber-400";
  return "text-red-400";
}

function statusBorder(s: CheckStatus) {
  if (s === "ok") return "border-t-emerald-500";
  if (s === "warning") return "border-t-amber-500";
  return "border-t-red-500";
}

function statusBg(s: CheckStatus) {
  if (s === "ok") return "bg-emerald-500/10";
  if (s === "warning") return "bg-amber-500/10";
  return "bg-red-500/10";
}

function StatusIcon({ status, className }: { status: CheckStatus; className?: string }) {
  if (status === "ok") return <CheckCircle2 className={cn("h-5 w-5 text-emerald-400", className)} />;
  if (status === "warning") return <AlertTriangle className={cn("h-5 w-5 text-amber-400", className)} />;
  return <XCircle className={cn("h-5 w-5 text-red-400", className)} />;
}

function globalLabel(s: CheckStatus) {
  if (s === "ok") return "Sistema saudavel";
  if (s === "warning") return "Atencao necessaria";
  return "Estado critico";
}

export default function HealthPage() {
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);

  const verificar = useCallback(async () => {
    setLoading(true);
    setErro(null);
    try {
      const res = await fetch("/api/master/health");
      if (!res.ok) throw new Error("Erro ao verificar saude do sistema");
      const json = await res.json();
      setData(json);
      setLastFetch(new Date());
    } catch {
      setErro("Falha ao conectar com o servidor de health");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    verificar();
    const interval = setInterval(() => { verificar(); }, 60000);
    return () => clearInterval(interval);
  }, [verificar]);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Header */}
      <div className="px-8 py-5 border-b border-border flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Activity className="h-5 w-5 text-blue-400" />
          <div>
            <h1 className="text-base font-bold text-foreground">Health Monitor</h1>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Auto-refresh a cada 60s
              {lastFetch && (
                <> &mdash; ultima verificacao: {lastFetch.toLocaleTimeString("pt-BR")}</>
              )}
            </p>
          </div>
        </div>
        <button
          onClick={verificar}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 text-sm font-medium hover:bg-blue-500/20 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          Verificar agora
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-8 bg-muted/30 space-y-6">
        {loading && !data && (
          <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">Verificando sistema...</div>
        )}
        {erro && (
          <div className="flex items-center justify-center h-40 text-red-400 text-sm">{erro}</div>
        )}

        {data && (
          <>
            {/* Badge global */}
            <div className={cn("flex items-center gap-4 p-5 rounded-xl border", statusBg(data.status), data.status === "ok" ? "border-emerald-500/30" : data.status === "warning" ? "border-amber-500/30" : "border-red-500/30")}>
              <StatusIcon status={data.status} className="h-8 w-8" />
              <div>
                <div className={cn("text-xl font-bold", statusColor(data.status))}>{globalLabel(data.status)}</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {data.checks.filter((c) => c.status === "ok").length} OK,&nbsp;
                  {data.checks.filter((c) => c.status === "warning").length} alerta,&nbsp;
                  {data.checks.filter((c) => c.status === "critical").length} critico
                  &nbsp;&mdash;&nbsp;{new Date(data.timestamp).toLocaleString("pt-BR")}
                </div>
              </div>
            </div>

            {/* Grid de checks */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {data.checks.map((check) => {
                const pct = check.limite != null
                  ? Math.min(Math.round((check.valor / check.limite) * 100), 100)
                  : null;
                return (
                  <Card key={check.nome} className={cn("border-t-4 shadow-sm", statusBorder(check.status))}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <StatusIcon status={check.status} />
                        {check.nome}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-baseline gap-1">
                        <span className={cn("text-3xl font-bold", statusColor(check.status))}>
                          {check.valor.toLocaleString("pt-BR")}
                        </span>
                        <span className="text-xs text-muted-foreground">{check.unidade}</span>
                        {check.limite != null && (
                          <span className="text-xs text-muted-foreground ml-1">/ {check.limite.toLocaleString("pt-BR")} limite</span>
                        )}
                      </div>

                      {pct != null && (
                        <div className="space-y-1">
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all",
                                check.status === "ok" ? "bg-emerald-500" : check.status === "warning" ? "bg-amber-500" : "bg-red-500"
                              )}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <div className="text-[10px] text-muted-foreground text-right">{pct}% do limite</div>
                        </div>
                      )}

                      <p className="text-xs text-muted-foreground">{check.mensagem}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
